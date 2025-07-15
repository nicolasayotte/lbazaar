{
  description = "PHP 8.2 + Composer via Nix Flakes";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
    }:
    let
      system = "x86_64-linux"; # Change if using another architecture
      pkgs = import nixpkgs { inherit system; };
      php82WithXml = pkgs.php82.withExtensions (
        {
          enabled,
          all,
        }:
        enabled ++ [ all.xml ]
      );
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs =
          [ php82WithXml ]
          ++ (with pkgs; [
            php82Packages.composer
            docker
          ]);

        shellHook = ''
          # Optional: Ensure Sail is executable if a Laravel project exists
          if [ -f ./vendor/bin/sail ]; then
            chmod +x ./vendor/bin/sail
            echo "Laravel Sail is ready to use!"
          else
            echo "Warning: use composer to require Sail"
          fi

          # Verify Docker is running
          if ! docker info >/dev/null 2>&1; then
            echo "Warning: Docker daemon is not running. Start it with 'sudo systemctl start docker'."
          fi
          zsh
        '';
      };
    };
}
