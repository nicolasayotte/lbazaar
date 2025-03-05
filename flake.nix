{
  description = "PHP 8.2 + Composer via Nix Flakes";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
  }: let
    system = "x86_64-linux"; # Change if using another architecture
    pkgs = import nixpkgs {inherit system;};
    php82WithXml = pkgs.php82.withExtensions ({
      enabled,
      all,
    }:
      enabled ++ [all.xml]);
  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs =
        [php82WithXml]
        ++ (with pkgs; [
          # apps
          php82Packages.composer
          podman

          # LSP
          phpactor
          dockerfile-language-server-nodejs
          docker-compose-language-service
        ]);

      shellHook = ''

        # Alias 'docker' to 'podman' for Sail compatibility
        alias docker=podman

        # Set a custom shell prompt
        export PS1='\[\e[1;32m\][PHP-Sail:\w]\$\[\e[0m\] '

        # Optional: Ensure Sail is executable if a Laravel project exists
        if [ -f ./vendor/bin/sail ]; then
          chmod +x ./vendor/bin/sail
          echo "Laravel Sail is ready to use!"
        else
          echo "Warning: Run 'composer require laravel/sail --dev' in a Laravel project to install Sail."
        fi

      '';
    };
  };
}
