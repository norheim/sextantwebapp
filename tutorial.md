# Get started
## Install all libraries
With node and npm installed getting started should be only a couple commands away. After cloning the git repository, from within the sextanwebapp folder type

    ~$ npm install

This will create a new folder called **/node_modules** where all the libraries will be stored. This will take up significant(100-150 MB) storage space, but for prototyping efforts that's fine, this will never actually be loaded into the browser.

Next, make sure babel-cli is installed. You can do this typing:

    ~$ babel-node

It should bring up a es6 syntax console where you can run javascript snippets. If it is not installed type:

    ~$ npm install --global babel-cli

## Run the server
All server side code is written with ES6 syntax, however the regular javascript compiler can't handle that yet so we need to transpile it with babel. This is pretty straight forward:

    ~$ babel-node server.js babel-node index.js --presets es2015,stage-2

This should say that it's serving on localhost:3001, and if you are patient enough(or gave your docker instance enough memory), after a while the console will also say that webpack created a bundle in 50 seconds(or shorter, hopefully), and then if you navigate to localhost:3001 you should see the sextant app!

# Underlying architecture
## Back end
With node.js you can do all your back-end development in Javascript(yay, can forget all about python and django!). To create an **html** server we will rely on a server library called **express**. It will take care of the routing of all server calls and make sure to serve the right resources - be they html, css, javascript or tile files. This routing can be seen at the bottom of the server.js file.

## Front end
### Javascript import... wait whut, isn't that python?
Another problem node.js tackles is your front-end javascript code(the javascript you would include in a script tag in your html document. When you split up your javascript code into several files(which you hopefully do because modularity ftw), the typical way of bringing it together is through a ton of include script tags in the header or the body of the html document, and using some global shared namespace combined with careful ordering of which script tag is included first(dont want to load a javascript file that needs jquery before you load jquery).

node.js comes with some libraries that simplify this process a ton by instead bundling up all your javascript modules in one large file to rule them all.. and hopefully not in the darkness bind them. And instead of making sure that javascript libraries are loaded in the right order and using a global namespace, javascript has a wannabe python import(and explicit export, limiting which functions or variables import statements can acces - which doesnt exist in python, where you can import anything from a file). Except since they couldn't just copy paste python's syntax, they [had to change it a little bit.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) Except this import syntax is only available in ES6 Javascript, which as we remember from earlier requires some translation to be done, preferrably by babel again.

### CSS import... in a Javascript file!
Yes, you are reading this correctly. No more need for style tags in the header of your webpage. The bundlers can normally tackle css files as-well, by just importing it into one of the javascript files. This is great especially when some javascript libraries(aka Cesium), go with library specific CSS.

### Bundling things up with: Webkit
I know of two libraries that can tackle the challenges of bundling and translating ES6 code(and also React, although React has not been added to this project): browserify and webkit. We are using webkit because... just because. It seems to be the easiest to setup, but don't take my words for it.

Webkit requires some configuration: webkit.config.js, where you tell it what syntax of javascript your are writing in (e.g. ES5 or ES6), the name of your output bundle (normally bundle.js), and some other things. For production you would actually generate a physical bundle.js file, however the way we run webkit right now, bundle.js is served by **express**(remember from earlier? it is our backend server) without being stored physically somewhere in a file.

### Hot Module Reload
If you looked a bunch at the code already, you will notice there seems to be a lot of weird overhead in server.js and webkit.config.js. Although in webkit.config.js some of the overhead configs are for cesium to properly work, the extra code is mostly to take advantage of a really cool feature that the bundling process allows for: hot module reload.

It lets you edit your javascript front end code(in one of your modules), and as soon as you click save, it will rebuild automatically, and on top of that the webpage with the include tag with build.js in it will make sure to reload the new bundled build.js to get the most recent version of the javascript. This save some significant reloading time very time a change is made. 

# Common pitfalls
A couple of things will easily crash things without you really understanding what's going. The most dangerous is forgetting to declare a variable in ES6. You always need to use const or let to declare a variable, and if this is not done the debugger will give you obscure errors that hide the real problem.

# Cesium
All mapping capabilities are through Cesium, the only library to my knowledge that offers the same features as our dear Google Earth(especially the fact that it can render 3D terrain).

## Importing Cesium
### The basics
So remember how easy ES6 is supposed to make library usage? Aka, we'd expect it to be as easy as ```import cesium ``` right? Wrong. 

The Cesium gang seems to have focused mainly on the users that would use Cesium as a script tag include, and not so much as modular code for bundling. Nevertheless, all hope is not lost - there is after all an npm cesium package, and all we have to do is to import every function individually from the source files in the node_modules package, for example:

```javascript
import CreateTileMapServiceImageryProvider from 'cesium/Source/Scene/createTileMapServiceImageryProvider';
```

Yeah, that's a mouthfull, and when you need twenty other cesium functions your import lines start taking up a significant space and might draw down on readibility. To save our mental efforts there is an intermediate file demo_code/cesium_imports.js that add a mini layer of abstraction around all these import statements. 

**Take-away:** if you need to import a Cesium function ([full list of all functions here](https://cesiumjs.org/Cesium/Build/Documentation/index.html)), do a search under node_modules/cesium/Source to find where the file for the function is located, then add the import to demo_code/cesium_imports.js, and use it in the rest of your javascript code as you please

### The advanced
With the basics you should now be able to know how to import a certain cesium function. However, to make cesium work there are a couple of other elements needed, but that you don't really need to know about - just make sure you don't delete these items from any of the files. This includes:

1) Some configurations in webpack.config.js
2) Some css imports
3) setBaseUrl
``` 
import buildModuleUrl from 'cesium/Source/Core/buildModuleUrl';
buildModuleUrl.setBaseUrl('./'); 
```

There are probably some other configurations taken care for in cesiumlib.js

## Rendering offline terrain and imagery
Yup, they go apart, because both have their own intricacies. So let's get started with the easiest: imagery.

### Cesium offline imagery
Cesium of the bat will use Bing maps(it highly suggests you to provide your own API key, but as we all know, who does that these days? - jokes apart, this repository has my private key in it, and I should do something to remove it, yup!). However, adding layers of tiles from different sources, e.g.: your own server is quite straightforward. 

// Side note: Im pretty sure OpenLayers has a similar feature - it just wont be able to do any 3D rendering off the terrain.

```javascript
const imageryProvider = CreateTileMapServiceImageryProvider({
      url : 'some_url to a served *folder* containing all the tiles',
      });
```

Yup, that was easy, and you can probably see where this is going, we serve the imagery tiles on localhost and just plop into the 'some_url'. No wizardry here, any gdal2tiles generated tile set will do the job. 

Can you be explicit on how to serve the tiles? Sure! **Express** will take care of that too. We serve any file and folder from the repository public/xxx so that it is available under localhost:3001/xxx. This can also be found in server.js:

```javascript
const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));
```

### Cesium offline terrain
Although the cesium syntax for rendering terrain is almost the same as for rendering imagery:

```javascript
const new_terrain_provider = new CesiumTerrainProvider({
            url : 'some_url to a served *folder* containing terrain tiles',
        });
```     

Serving the terrain is not quite as simple. This is mainly because the tileset generated by [cesium terrain builder library](https://github.com/geo-data/cesium-terrain-builder) is missing some information(c'mon you'd think they could have fixed it in the source code, right?), and we have to fill that infor in manually. There are two key elements missing:

- a layer.json file, that describes the structure of the folders containing the terrain tiles
- a top level dummy terrain file terrain/0/0/0.terrain or something like that

Without these, unfortunately the CesiumTerrainProvider will give you errors and nothing will work :(

Fear not however, this has been taken care off by doing some rerouting in the file terrainserver.js, but it pretty much boils down to:

- reroute any call to a terrain_folder/layer.json to the the layer.json being served by express, since this file is in the public folder already
- reroute any call to the dummy file to smallterrain-blank.terrain, which is also already being served by express, since this file is in the public folder

## Drawing in Cesium
Coming soon!
