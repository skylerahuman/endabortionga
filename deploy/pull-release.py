"""Trusted host-side artifact puller. Never execute this script from an artifact."""
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import urllib.request
import urllib.error
import zipfile

REPO = 'skylerahuman/endabortionga'
BASE = Path('/var/lib/eag-releases')
TOKEN = (Path(os.environ['CREDENTIALS_DIRECTORY']) / 'github-token').read_text().strip()


def api(path):
    request = urllib.request.Request('https://api.github.com/repos/' + REPO + '/' + path,
        headers={'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json',
                 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'eag-release-puller'})
    return json.load(urllib.request.urlopen(request, timeout=30))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def download(artifact):
    # Do not forward the GitHub credential to the signed storage URL.
    req = urllib.request.Request(artifact['archive_download_url'],
        headers={'Authorization': 'Bearer ' + TOKEN, 'User-Agent': 'eag-release-puller'})
    try:
        urllib.request.build_opener(NoRedirect).open(req, timeout=30)
        raise RuntimeError('Expected signed artifact redirect')
    except urllib.error.HTTPError as exc:
        if exc.code != 302:
            raise
        location = exc.headers['Location']
    if not location.startswith('https://'):
        raise RuntimeError('Non-HTTPS artifact URL')
    data = urllib.request.urlopen(location, timeout=120).read(250_000_001)
    if len(data) > 250_000_000:
        raise RuntimeError('Artifact too large')
    digest = 'sha256:' + hashlib.sha256(data).hexdigest()
    if artifact.get('digest') != digest:
        raise RuntimeError('Artifact digest mismatch or missing digest')
    return data


def select(link, target):
    temporary = link.with_suffix('.next')
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(target)
    temporary.replace(link)


def deploy(branch):
    if branch == 'prd' and not Path('/var/lib/eag-deploy-secrets/production-enabled').is_file():
        print('prd: automatic promotion disabled pending GitHub branch protections', flush=True)
        return
    directory = BASE / branch
    directory.mkdir(parents=True, exist_ok=True)
    head = api('branches/' + branch)['commit']['sha']
    runs = api('actions/workflows/tests.yml/runs?branch=' + branch + '&status=success&per_page=20')['workflow_runs']
    runs = [r for r in runs if r['head_sha'] == head and r['event'] in ('push', 'workflow_dispatch')
            and r['head_repository']['full_name'] == REPO and r['head_branch'] == branch]
    if not runs:
        print(branch + ': waiting for successful build at branch HEAD', flush=True)
        return
    run = runs[0]
    release = directory / (head + '-' + str(run['id']))
    current = directory / 'current'
    if current.is_symlink() and current.resolve() == release:
        return
    artifacts = api('actions/runs/' + str(run['id']) + '/artifacts')['artifacts']
    artifact = next(a for a in artifacts if a['name'] == 'site-' + branch and not a['expired'])
    data = download(artifact)
    staging = directory / 'staging'
    shutil.rmtree(staging, ignore_errors=True)
    staging.mkdir()
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            if archive.namelist() != ['site.tar.gz']:
                raise RuntimeError('Unexpected artifact contents')
            with tarfile.open(fileobj=io.BytesIO(archive.read('site.tar.gz')), mode='r:gz') as tar:
                members = tar.getmembers()
                if sum(m.size for m in members) > 750_000_000:
                    raise RuntimeError('Expanded artifact too large')
                for member in members:
                    path = Path(member.name)
                    if path.is_absolute() or '..' in path.parts or not (member.isfile() or member.isdir()):
                        raise RuntimeError('Unsafe archive entry: ' + member.name)
                tar.extractall(staging, members=members, filter='data')
        for root, dirs, files in os.walk(staging):
            os.chmod(root, 0o755)
            for file in files:
                os.chmod(Path(root) / file, 0o644)
        is_app = (staging / 'build/index.js').is_file()
        expected = staging / ('build/index.js' if is_app or branch == 'dev' else 'index.html')
        if not expected.is_file():
            raise RuntimeError('Incomplete release')
        # Recheck HEAD after download so a superseded build cannot be promoted.
        if api('branches/' + branch)['commit']['sha'] != head:
            raise RuntimeError('Branch changed during deployment; retry on next timer tick')
        if release.exists():
            shutil.rmtree(release)
        staging.rename(release)
        previous = current.resolve() if current.is_symlink() else None
        select(current, release)
        if is_app:
            service = 'eag-preview.service' if branch == 'dev' else 'eag-production.service'
            port = 3100 if branch == 'dev' else 3101
            try:
                subprocess.run(['systemctl', 'restart', service], check=True)
                import time
                for attempt in range(30):
                    try:
                        response = urllib.request.urlopen(f'http://127.0.0.1:{port}/api/regions', timeout=2)
                        if response.status == 200:
                            break
                    except (OSError, urllib.error.URLError):
                        pass
                    time.sleep(1)
                else:
                    raise RuntimeError(branch + ' application/database health check failed')
            except Exception:
                if previous:
                    select(current, previous)
                    subprocess.run(['systemctl', 'restart', service], check=True)
                else:
                    current.unlink(missing_ok=True)
                raise
        if previous:
            select(directory / 'previous', previous)
        print(branch + ': deployed ' + head + ' from run ' + str(run['id']), flush=True)
    finally:
        shutil.rmtree(staging, ignore_errors=True)


if __name__ == '__main__':
    errors = []
    for branch in ('dev', 'prd'):
        try:
            deploy(branch)
        except Exception as exc:
            print(branch + ': ' + str(exc), flush=True)
            errors.append(branch)
    if errors:
        raise SystemExit(1)
