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

##Front end
Another problem node.js tackles is your front-end javascript code(the javascript you would include in a <script> tag in your html document. When you split up your javascript code into several files(which you hopefully do because modularity ftw), the typical way of bringing it together is through a ton of <script> include tags in the header or the body of the html document, and using some global shared namespace combined with careful ordering of which script tag is included first(dont want to load a javascript file that needs jquery before you load jquery).

node.js comes with some libraries that simplify this process a ton by instead bundling up all your javascript modules in one large file to rule them all.. and hopefully not in the darkness bind them. And instead of making sure that javascript libraries are loaded in the right order and using a global namespace, javascript has a wannabe python import(and explicit export, limiting which functions or variables import statements can acces - which doesnt exist in python, where you can import anything from a file). Except since they couldn't just copy paste python's syntax, they [had to change it a little bit.]
(https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import). Except this import syntax is only available in ES6 Javascript, which as we remember from earlier requires some translation to be done, preferrably by babel again.

###Webkit
I know of two libraries that can tackle both of these challenges, bundling and translating: browserify and webkit. We are using webkit because... just because. It seems to be the easiest to setup, but don't take my words for it.

Webkit requires some configuration: webkit.config.js, where you tell it what syntax of javascript your are writing in (e.g. ES5 or ES6), the name of your output bundle (normally bundle.js), and some other things. For production you would actually generate a physical bundle.js file, however the way we run webkit right now, bundle.js is served by **express**(remember from earlier? it is our backend server) without being stored physically somewhere in a file.
