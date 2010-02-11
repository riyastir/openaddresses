/*
 * @requires app/js/OpenAddressesConfig.js
 * @include OpenLayers/Map.js
 * @include OpenLayers/Lang.js
 * @include OpenLayers/Projection.js
 * @include OpenLayers/Layer.js
 * @include OpenLayers/Layer/XYZ.js
 * @include OpenLayers/Layer/Yahoo.js
 * @include OpenLayers/Tile/Image.js
 * @include OpenLayers/Control/Navigation.js
 * @include OpenLayers/Control/PanZoomBar.js
 * @include OpenLayers/Control/MousePosition.js
 * @include OpenLayers/Control/LayerSwitcher.js
 * @include OpenLayers/Popup/FramedCloud.js
 * @include GeoExt/data/LayerStore.js
 * @include GeoExt/widgets/MapPanel.js
 * @include GeoExt/widgets/tree/LayerContainer.js
 * @include app/js/OpenAddressesOsm.js
 * @include app/js/OpenAddressesLanguage.js
 * @include app/js/OpenAddressesLayers.js
 * @include geoext-ux-dev/DisplayProjectionSelectorCombo/ux/widgets/form/DisplayProjectionSelectorCombo.js
 * @include mfbase/geoext-ux/ux/GeoNamesSearchCombo/lib/GeoExt.ux.geonames/GeoNamesSearchCombo.js
 */

Ext.namespace("openaddresses");

openaddresses.layout = (function() {
    /*
     * Private
     */

    /**
     * Method: createMap
     * Create the map.
     *
     * Returns:
     * {OpenLayers.Map} The OpenLayers.Map instance.
     */
    var createMap = function() {
        var navControl = new OpenLayers.Control.Navigation({
            handleRightClicks: true
        });

        return new OpenLayers.Map({
            projection: new OpenLayers.Projection("EPSG:900913"),
            displayProjection: new OpenLayers.Projection("EPSG:4326"),
            units: "m",
            maxResolution: 156543.0339,
            maxExtent: new OpenLayers.Bounds(-20037508, -20037508,
                    20037508, 20037508.34),
            numZoomLevels: 23,
            allOverlays: false,
            controls: [navControl,
                new OpenLayers.Control.PanZoomBar(),
                new OpenLayers.Control.MousePosition({
                    numDigits: 2
                }),
                new OpenLayers.Control.LayerSwitcher({'ascending':false})]
        });
    };

    /**
     * Method: createLayers
     * Create the layers.
     *
     * Returns:
     * {Array({OpenLayers.Layer}) Array of layers.
     */
    var createLayers = function() {
        return openaddresses.layers.concat([
            new openaddresses.OSM({
                isBaseLayer: true,
                buffer: 0,
                transitionEffect: "resize"
            }),
            new OpenLayers.Layer.Yahoo(
                    "Yahoo Satellite",
            {'type': YAHOO_MAP_SAT, 'sphericalMercator': true}
                    ),
            new OpenLayers.Layer("Empty", {
                isBaseLayer: true,
                displayInLayerSwitcher: true
            })
        ]);
    };

    /**
     * Method: createLayerStore
     * Create a GeoExt layer store.
     *
     * Parameters:
     * map - {OpenLayers.Map} The Map instance.
     * layers - {Array({OpenLayers.Layer})} The layers to add to the store.
     *
     * Returns:
     * {GeoExt.data.LayerStore} The layer store.
     *
     */
    var createLayerStore = function(map, layers) {
        return new GeoExt.data.LayerStore({
            map: map,
            layers: layers
        });
    };

    var createTopToolbar = function(map, languageCombo, geonamesSearchCombo, permalinkButton) {
        var tools = [];
        tools.push(geonamesSearchCombo);
        tools.push('->');
        tools.push(languageCombo);
        tools.push(permalinkButton);
        return tools;
    };

    var createBottomToolbar = function(map, displayProjectionSelectorCombo) {
        var tools = [];
        tools.push('->');
        tools.push(displayProjectionSelectorCombo);
        return tools;
    };

    var createLanguageStore = function() {
        return new Ext.data.ArrayStore({
            fields: ['code', 'language', 'charset'],
            data : openaddresses.languages
        });
    };

    var createLanguageCombo = function(languageStore) {
        return new Ext.form.ComboBox({
            store: languageStore,
            displayField:'language',
            typeAhead: true,
            mode: 'local',
            triggerAction: 'all',
            emptyText: OpenLayers.i18n('Select a language...'),
            selectOnFocus: true,
            onSelect: function(record) {
                var params = Ext.urlDecode(window.location.search.substring(1));
                var parametersObj = {};
                for (var param in params) {
                    if (param == 'lang' || param == 'charset') {
                    } else {
                        parametersObj[param] = params[param];
                    }
                }
                parametersObj.lang = record.get("code");
                parametersObj.charset = record.get("charset");
                window.location.search = Ext.urlEncode(parametersObj);
            }
        });
    };

    var createViewPort = function(map, layers, layerStore, topToolbar, bottomToolbar) {
        return new Ext.Viewport({
            layout: "border",
            items: [
                {
                    region: 'north',
                    height: 64
                },
                {
                    region: "center",
                    xtype: "gx_mappanel",
                    margins: '5 0 5 0',
                    map: map,
                    layout:'absolute',
                    layers: layerStore,
                    tbar: topToolbar,
                    bbar: bottomToolbar
                },
                {
                    region: 'west',
                    width: 256,
                    minSize: 256,
                    maxSize: 512,
                    split: true,
                    margins: '5 0 5 5',
                    layout:'accordion',
                    items: [
                        {
                            title: OpenLayers.i18n('OpenAddresses')
                        },
                        {
                            title: OpenLayers.i18n('Upload')
                        },
                        {
                            title: OpenLayers.i18n('Download')
                        },
                        {
                            title: OpenLayers.i18n('Services')
                        },
                        {
                            title: OpenLayers.i18n('Statistics')
                        },
                        {
                            title: OpenLayers.i18n('License')
                        },
                        {
                            title: OpenLayers.i18n('About')
                        }
                    ]
                }
            ]
        });
    };

    var createDisplayProjectionSelectorCombo = function(map) {
        return new GeoExt.ux.form.DisplayProjectionSelectorCombo({
            map: map,
            projections: ['EPSG:4326', 'EPSG:900913'],
            width: 200
        });
    };

    var createGeonamesSearchCombo = function(map) {
        return new GeoExt.ux.geonames.GeoNamesSearchCombo({
            map: map,
            zoom: 12
        });
    };

    var setLangPermalink = function(languageStore, languageCombo) {
        var params = Ext.urlDecode(window.location.search.substring(1));
        if (!params.lang && $('lang').value) {
            params.lang = $('lang').value;
        }
        if (params.lang) {
            OpenLayers.Lang.setCode(params.lang);
            // check if there's really a language with that language code
            var record = languageStore.data.find(function(item, key) {
                return (item.data.code == params.lang);
            });
            // if language was found in store assign it as current value in combobox
            if (record) {
                languageCombo.setValue(record.data.language);
            }
        }
    };

    var handleRightMouseClick = function(map) {
        map.controls[0].handlers.click.callbacks.rightclick = function() {
            var lonlat = map.getLonLatFromViewPortPx(map.controls[0].handlers.click.evt.xy);
            var content = "<h1 style='font-size: 14px;'>" + OpenLayers.i18n("Digitized Position") + "</h1><table style='font-size: 14px;'><tr><td width=\"150\">" + "" + OpenLayers.i18n("Spherical Mercator") + "</td><td>" + Math.round(lonlat.lon * 10) / 10 + " " + Math.round(lonlat.lat * 10) / 10 + '</td></tr>';
            lonlat.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
            content = content + "<tr><td>" + OpenLayers.i18n("WGS84") + "</td><td>" + Math.round(lonlat.lon * 100000) / 100000 + " " + Math.round(lonlat.lat * 100000) / 100000 + '</td></tr></table>';
            // Create empty proxy
            map.myProxy = new Ext.data.ScriptTagProxy({
                url: "http://maps.google.com/maps/geo?q=" + lonlat.lat + "," + lonlat.lon + "&output=json&sensor=true&key=" + openaddresses.config.googleKey,
                nocache: false
            });
            map.geocoderStore = new Ext.data.Store({
                proxy: map.myProxy,
                reader: new Ext.data.JsonReader({
                    root: 'Placemark',
                    fields: [
                        {
                            name: 'address'
                        }
                    ]
                })
            });

            map.geocoderStore.on(
                    'load', function(store) {
                var placemark = store.reader.jsonData.Placemark[0];
                var position = new OpenLayers.LonLat(placemark.Point.coordinates[0], placemark.Point.coordinates[1]);
                position.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
                if (map.myPopup) {
                    map.myPopup.destroy();
                }
                map.myPopup = new OpenLayers.Popup.FramedCloud(
                        "chicken",
                        position,
                        null,
                        content + "<h1 style='font-size: 14px;'>" + OpenLayers.i18n("Address") + "</h1>" + placemark.address,
                        null,
                        true
                        );
                map.addPopup(map.myPopup);
            }, this);

            map.geocoderStore.load();
        };
    };

    var createPermalinkButton = function() {
        return new Ext.Button({
            text: OpenLayers.i18n('Permalink'),
            handler: function(b, e) {
                window.open(openaddresses.layout.createPermalink());
            }
        });
    };

    var setPermalink = function() {
        var params = Ext.urlDecode(window.location.search.substring(1));
        // Manage map
        if (params.easting && params.northing && params.zoom) {
            var center = new OpenLayers.LonLat(parseFloat(params.easting),parseFloat(params.northing));
            var zoom = parseInt(params.zoom);
            openaddresses.layout.map.setCenter(center,zoom);
        }
    };

    /*
     * Public
     */
    return {
        createPermalink: function() {
            var params = Ext.urlDecode(window.location.search.substring(1));
            var parametersObj = {};
            for (var param in params) {
                if (param == 'lang' || param == 'charset' || param == 'mode') {
                    parametersObj[param] = params[param];
                }
            }
            // Create map permalink
            parametersObj['northing'] = this.map.center.lat;
            parametersObj['easting'] = this.map.center.lon;
            parametersObj['zoom'] = this.map.zoom;
            var base = '';
            if (document.location.href.indexOf("?") > 0) {
                base = document.location.href.substring(0,document.location.href.indexOf("?"));
            } else {
                base = document.location.href;
            }
            return base + '?' + Ext.urlEncode(parametersObj);
        },

        /**
         * APIMethod: init
         * Initialize the page layout.
         */
        init: function() {
            Ext.QuickTips.init();

            // Manage language
            var languageStore = createLanguageStore();
            var languageCombo = createLanguageCombo(languageStore);
            setLangPermalink(languageStore, languageCombo);

            this.map = createMap();
            this.layers = createLayers();
            var layerStore = createLayerStore(this.map, this.layers);
            var geonamesSearchCombo = createGeonamesSearchCombo(this.map);
            var permalinkButton = createPermalinkButton();
            var topToolbar = createTopToolbar(this.map, languageCombo, geonamesSearchCombo, permalinkButton);
            var displayProjectionSelectorCombo = createDisplayProjectionSelectorCombo(this.map);


            var bottomToolbar = createBottomToolbar(this.map, displayProjectionSelectorCombo);

            handleRightMouseClick(this.map);

            this.viewport = createViewPort(this.map, this.layers, layerStore, topToolbar, bottomToolbar);
            this.map.zoomTo(1);
            this.map.events.register('zoomend', this, function(record) {
                if (this.map.zoom == 0) {
                    this.map.zoomTo(1);
                }
            });
            setPermalink();
        }
    };
})();