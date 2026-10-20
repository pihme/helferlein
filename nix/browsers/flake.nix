{
  description = "helferlein: Playwright browser libraries";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  inputs.reference-env.url = "path:../reference-env";

  outputs = { self, nixpkgs, reference-env }:
    let
      systems = ["x86_64-linux" "aarch64-linux" "aarch64-darwin"];
      libs = pkgs: with pkgs; [
        alsa-lib at-spi2-atk at-spi2-core atk cairo cups dbus expat flac
        fontconfig freetype gdk-pixbuf glib gtk3 harfbuzz icu libdrm
        libglvnd libnotify libopus libunwind libxkbcommon mesa nspr nss
        pango pipewire libsecret libwebp libjpeg_turbo libpng zlib udev
        dejavu_fonts
        libx11 libxcomposite libxcursor libxdamage
        libxext libxfixes libxi libxrandr libxrender
        libxtst libxcb libxshmfence
        gst_all_1.gstreamer gst_all_1.gst-plugins-base gst_all_1.gst-plugins-good
      ];
    in {
      devShells = nixpkgs.lib.genAttrs systems (system:
        let pkgs = nixpkgs.legacyPackages.${system}; in {
          default = pkgs.mkShell {
            inputsFrom = [ reference-env.devShells.${system}.default ];
            packages = libs pkgs;
            shellHook = ''
              export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath (libs pkgs)}''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}
              export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
            '';
          };
        });
    };
}
