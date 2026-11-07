{ pkgs, lib, ... }:
let
  app = branch: user: port: origin: {
    description = "GitHub-built EAG ${branch} application";
    wantedBy = [ "multi-user.target" ];
    unitConfig.ConditionPathExists = "/var/lib/eag-releases/${branch}/current/build/index.js";
    environment = {
      HOST = "127.0.0.1"; PORT = port; ORIGIN = origin; NODE_ENV = "production";
      DATABASE_PATH = "/var/lib/${user}/movement.sqlite";
      PUBLIC_SITE_ENV = branch;
      PUBLIC_SHOW_MAP_DEBUG = "false"; PUBLIC_SHOW_PREVIEW_LABELS = "false";
    };
    serviceConfig = {
      User = user; Group = user;
      WorkingDirectory = "/var/lib/eag-releases/${branch}/current";
      StateDirectory = user; StateDirectoryMode = "0700";
      ExecStart = "${pkgs.nodejs_22}/bin/node build/index.js";
      Restart = "on-failure"; RestartSec = 3;
      NoNewPrivileges = true; ProtectSystem = "strict"; ProtectHome = true;
      PrivateTmp = true; PrivateDevices = true;
      ProtectKernelTunables = true; ProtectKernelModules = true; ProtectControlGroups = true;
      CapabilityBoundingSet = ""; RestrictSUIDSGID = true;
      MemoryMax = "512M"; TasksMax = 64; UMask = "0077";
    };
  };
in {
  users.groups.eag-preview = {};
  users.users.eag-preview = { isSystemUser = true; group = "eag-preview"; };
  users.groups.eag-production = {};
  users.users.eag-production = { isSystemUser = true; group = "eag-production"; };
  systemd.tmpfiles.rules = [
    "d /var/lib/eag-releases 0755 root root -"
    "d /var/lib/eag-releases/dev 0755 root root -"
    "d /var/lib/eag-releases/prd 0755 root root -"
  ];
  systemd.services.eag-preview = app "dev" "eag-preview" "3100" "https://dev.endabortionga.org";
  systemd.services.eag-production = app "prd" "eag-production" "3101" "https://endabortionga.org";
  systemd.services.eag-deploy = {
    description = "Pull verified GitHub EAG branch release artifacts";
    after = [ "network-online.target" ]; wants = [ "network-online.target" ];
    path = [ pkgs.systemd ];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = "${pkgs.python3}/bin/python3 /opt/eag-deploy/pull-release.py";
      LoadCredential = "github-token:/var/lib/eag-deploy-secrets/github-token";
      NoNewPrivileges = true; ProtectSystem = "strict"; ProtectHome = true;
      PrivateTmp = true; PrivateDevices = true;
      ProtectKernelTunables = true; ProtectKernelModules = true; ProtectControlGroups = true;
      ReadWritePaths = [ "/var/lib/eag-releases" ];
      UMask = "0022"; TimeoutStartSec = 300;
    };
  };
  systemd.timers.eag-deploy = {
    wantedBy = [ "timers.target" ];
    timerConfig = { OnBootSec = "60s"; OnUnitInactiveSec = "60s"; Unit = "eag-deploy.service"; };
  };
  services.caddy.virtualHosts."dev.endabortionga.org".extraConfig = lib.mkForce ''
    header Strict-Transport-Security "max-age=31536000"
    header X-Robots-Tag "noindex, nofollow"
    header Cache-Control "no-store"
    reverse_proxy 127.0.0.1:3100
  '';
  services.caddy.virtualHosts."endabortionga.org" = {
    logFormat = null;
    extraConfig = ''
      header Strict-Transport-Security "max-age=31536000"
      header X-Content-Type-Options "nosniff"
      header Cache-Control "no-cache"
      root * /var/lib/eag-releases/prd/current
      @holding file /index.html
      handle @holding {
        file_server
      }
      handle {
        reverse_proxy 127.0.0.1:3101
      }
    '';
  };
}
