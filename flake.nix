{
  description = "PHP 8.2 + Composer via Nix Flakes";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }: {
    devShells.default = with import nixpkgs { system = "x86_64-linux"; }; mkShell {
      buildInputs = [
        php82
        php82Packages.composer
      ];
    };
  };
}

