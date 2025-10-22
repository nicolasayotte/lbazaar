<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Console\GeneratorCommand;
use Symfony\Component\Console\Input\InputArgument;

class MakeRepository extends GeneratorCommand
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:repository {name} {--model=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate repository class with a specified model';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        parent::handle();
    }

    /**
     * @Override
     */
    protected function buildClass($name)
    {
        $stub = $this->files->get($this->getStub());

        return $this->replaceNamespace($stub, $name)
                    ->replaceModel($stub, $this->option('model'))
                    ->replaceClass($stub, $name);
    }

    /**
     * Get the stub file for the generator
     *
     * @return string
     */
    public function getStub()
    {
        return base_path('/stubs/repository.stub');
    }

    /**
    * Get the default namespace for the class.
    *
    * @param  string  $rootNamespace
    * @return string
    */
    protected function getDefaultNamespace($rootNamespace)
    {
        return $rootNamespace . '/Repositories';
    }

    /**
     * Replace the model name for the given stub
     *
     * @param string $stub
     * @param string $name
     * @return $this
     */
    private function replaceModel(&$stub, $model)
    {
        $modelSearch = ['{{ model }}', '{{model}}'];

        // Replace the {{ model }} string inside stub
        foreach ($modelSearch as $search) {
            $stub = str_replace(
                $search,
                $model,
                $stub
            );
        }

        return $this;
    }
}
