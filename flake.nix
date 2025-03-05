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
  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        phpactor
        dockerfile-language-server-nodejs
        docker-compose-language-service
        php82
        php82Packages.composer
      ];
    };
  };
}
