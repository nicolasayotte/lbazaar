<!DOCTYPE html>
<html>
  <head>
    <title inertia>{{ @$title }}</title>
    <meta name="description" content="{{ @$description }}">
    <meta name="author" content="{{ @$author }}">
    <meta name="keywords" content="{{ @$keywords }}">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    @viteReactRefresh
    @vite(['resources/sass/app.scss', 'resources/js/app.jsx'])
    @inertiaHead
  </head>
  <body>
    @inertia
  </body>
</html>
