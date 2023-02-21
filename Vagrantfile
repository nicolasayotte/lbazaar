Vagrant.configure(2) do |config|
    config.vm.box = "generic/ubuntu2204" # Ubuntu 18.04
    config.vm.provider "parallels" do |pl, override|
        override.vm.box = "jharoian3/ubuntu-22.04-arm64" # Ubuntu 22.04 ARM64 for Parallels
        pl.cpus = 2
        pl.memory = 2048 # MB
        override.vm.synced_folder '.', '/vagrant'
    end

    # Network and mount configuration
    config.hostsupdater.aliases = ["develop.l-e-bazaar.com"]
    config.vm.network :private_network, ip:"10.225.1.17"
end
