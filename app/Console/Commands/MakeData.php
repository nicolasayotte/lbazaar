<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Console\GeneratorCommand;

class MakeData extends GeneratorCommand
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:data {name} {--properties=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate DTO class';

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
                    ->replaceProperties($stub, $this->option('properties'))
                    ->replaceSetters($stub, $this->option('properties'))
                    ->replaceGetters($stub, $this->option('properties'))
                    ->replaceClass($stub, $name);
    }

    /**
     * Get the stub file for the generator
     *
     * @return string
     */
    public function getStub()
    {
        return base_path('/stubs/data.stub');
    }

    /**
    * Get the default namespace for the class.
    *
    * @param  string  $rootNamespace
    * @return string
    */
    protected function getDefaultNamespace($rootNamespace)
    {
        return $rootNamespace . '/Data';
    }

    /**
     * Replace the {{ properties }} string from the given stub
     *
     * @param string $stub The stub file
     * @param string $properties The properties that will be generated
     */
    private function replaceProperties(&$stub, $propertiesString)
    {
        $propertiesSearch = ['{{ properties }}', '{{properties}}'];

        $properties = explode(',', $propertiesString);

        $propertyString = '';

        foreach ($properties as $index => $property) {
            $propertyString .= "private $$property;" . ($index + 1 < count($properties) ? "\n\t\n\t" : "");
        }

        foreach ($propertiesSearch as $search) {
            $stub = str_replace(
                $search,
                $propertyString,
                $stub
            );
        }

        return $this;
    }

    /**
     * Replace the {{ setters }} string from the given stub
     *
     * @param string $stub The stub file
     * @param string $properties The properties that will be generated
     */
    private function replaceSetters(&$stub, $propertiesString)
    {
        $settersSearch = ['{{ setters }}', '{{setters}}'];

        $properties = explode(',', $propertiesString);

        $settersString = '';

        foreach ($properties as $index => $property) {
            $camelizedProperty = str_replace('_', '', ucwords($property, '_'));

            $settersString .= "public function set".$camelizedProperty."($".$property.")\n\t";
            $settersString .= "{\n\t\t";
            $settersString .= '$this->'.$property." = $".$property.";\n\t\t";
            $settersString .= 'return $this;' . "\n\t";
            $settersString .= "}";

            if ($index + 1 < count($properties)) {
                $settersString .= "\n\n\t";
            }
        }

        foreach ($settersSearch as $search) {
            $stub = str_replace(
                $search,
                $settersString,
                $stub
            );
        }

        return $this;
    }

    /**
     * Replace the {{ getters }} string from the given stub
     *
     * @param string $stub The stub file
     * @param string $properties The properties that will be generated
     */
    private function replaceGetters(&$stub, $propertiesString)
    {
        $gettersSearch = ['{{ getters }}', '{{getters}}'];

        $properties = explode(',', $propertiesString);

        $gettersString = '';

        foreach ($properties as $index => $property) {
            $camelizedProperty = str_replace('_', '', ucwords($property, '_'));

            $gettersString .= "public function get".$camelizedProperty."()\n\t";
            $gettersString .= "{\n\t\t";
            $gettersString .= 'return $this->' . "$property;\n\t";
            $gettersString .= "}";

            if ($index + 1 < count($properties)) {
                $gettersString .= "\n\n\t";
            }
        }

        foreach ($gettersSearch as $search) {
            $stub = str_replace(
                $search,
                $gettersString,
                $stub
            );
        }

        return $this;
    }
}
