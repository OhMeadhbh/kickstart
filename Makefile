# Makefile

MODULES = node-props node-mug less hbs express

BUILDS = ./build/bootstrap

default : ./node_modules $(BUILDS) less

clean : 
	rm -rf ./node_modules
	rm -rf ./build
	rm static/js/bootstrap.js
	rm static/img/glyphicons*png
	rm static/css/bootstrap.css
	rm less/css/*

./node_modules :
	mkdir ./node_modules
	npm install $(MODULES)

./build :
	mkdir ./build

./build/bootstrap : ./build
	git clone git://github.com/twitter/bootstrap.git build/bootstrap
	cp build/bootstrap/img/* static/img
	cat build/bootstrap/js/*js > static/js/bootstrap.js
	cp build/bootstrap/less/*less less/css

less : ./build/bootstrap
	node_modules/less/bin/lessc less/css/bootstrap.less static/css/bootstrap.css