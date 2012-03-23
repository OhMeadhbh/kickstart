# Makefile

MODULES = node-props node-mug less hbs express emailjs oauth mysql

BUILDS = ./build/bootstrap

BOOTSTRAPJS = \
	build/bootstrap/js/bootstrap-alert.js \
	build/bootstrap/js/bootstrap-button.js \
	build/bootstrap/js/bootstrap-carousel.js \
	build/bootstrap/js/bootstrap-collapse.js \
	build/bootstrap/js/bootstrap-dropdown.js \
	build/bootstrap/js/bootstrap-modal.js \
	build/bootstrap/js/bootstrap-tooltip.js \
	build/bootstrap/js/bootstrap-popover.js \
	build/bootstrap/js/bootstrap-scrollspy.js \
	build/bootstrap/js/bootstrap-tab.js \
	build/bootstrap/js/bootstrap-transition.js \
	build/bootstrap/js/bootstrap-typeahead.js


default : ./node_modules $(BUILDS) static/css/bootstrap.css static/js/underscore-min.js static/js/backbone-min.js static/js/handlebars-1.0.0.beta.6.js

clean : 
	rm -rf ./node_modules
	rm -rf ./build
	rm -rf ./less
	rm static/js/bootstrap.js
	rm static/js/underscore-min.js
	rm static/js/backbone-min.js
	rm static/js/handlebars-1.0.0.beta.6.js
	rm static/img/glyphicons*png
	rm static/css/bootstrap.css

./node_modules :
	mkdir ./node_modules
	npm install $(MODULES)

./build :
	mkdir ./build

./build/bootstrap : ./build
	git clone git://github.com/twitter/bootstrap.git build/bootstrap
	cp build/bootstrap/img/* static/img
	cat $(BOOTSTRAPJS) >> static/js/bootstrap.js
	mkdir less
	mkdir less/css
	cp build/bootstrap/less/*less less/css

static/css/bootstrap.css :
	node_modules/less/bin/lessc less/css/bootstrap.less static/css/bootstrap.css

static/js/underscore-min.js :
	wget -O static/js/underscore-min.js http://documentcloud.github.com/underscore/underscore-min.js

static/js/backbone-min.js :
	wget -O static/js/backbone-min.js http://documentcloud.github.com/backbone/backbone-min.js

static/js/handlebars-1.0.0.beta.6.js :
	wget -O static/js/handlebars-1.0.0.beta.6.js https://github.com/downloads/wycats/handlebars.js/handlebars-1.0.0.beta.6.js
