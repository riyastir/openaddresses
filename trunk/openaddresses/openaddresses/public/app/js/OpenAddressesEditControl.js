/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/*
 * @requires OpenLayers/Control.js
 * @include OpenLayers/Handler/Click.js
 * @include OpenLayers/Projection.js
 * @include OpenLayers/Control/ModifyFeature.js
 * @include OpenLayers/BaseTypes/LonLat.js
 * @include OpenLayers/Feature/Vector.js
 * @include OpenLayers/Geometry/Point.js
 * @include GeoExt/widgets/Popup.js
 */

Ext.namespace("openaddresses");

openaddresses.EditControl = OpenLayers.Class(OpenLayers.Control, {

    /** api: property[defaultHandlerOptions]
     *  Default options.
     */
    defaultHandlerOptions: {
        'single': true,
        'double': false,
        'pixelTolerance': 0,
        'stopSingle': false,
        'stopDouble': false
    },

    /** private: method[initialize]
     *  Initializes the control
     */
    initialize: function(options) {
        this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.handler = new OpenLayers.Handler.Click(this, {
            'click': this.onClick,
            'dblclick': this.onDblclick},
                this.handlerOptions
                );
    },

    /** private: method[onClick]
     */
    onClick: function(evt) {
        // Pseudo code
        // 1. Check if an address exists at this position
        //  2. If yes
        //     - show a movable circle in the map at the position of the address (create a modify feature control)
        //     - show the edition popup
        //  3. if no
        //     - show a movable circle in the map at the digitized poistion
        //     - show the edition popup
        var clickedPosition = openaddresses.layout.map.getLonLatFromViewPortPx(evt.xy);
        var clickePositionWGS84 = clickedPosition.clone();
        clickePositionWGS84.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));

        var vectorLayer = openaddresses.layout.map.getLayersByName('DrawingLayer')[0];
        var map = openaddresses.layout.map;

        var cancelEditing = function(feature) {
            if (feature.editingPopup) {
                feature.editingPopup.close();
                delete feature.editingPopup;
            }
            vectorLayer.removeFeatures(feature);
            delete feature;
        };

        var addPopup = function(feature) {
            var comboCountry = new Ext.form.ComboBox({
                store: openaddresses.countryStore,
                fieldLabel: OpenLayers.i18n('Country'),
                displayField:'countryName',
                typeAhead: true,
                mode: 'local',
                triggerAction: 'all',
                width: 240,
                emptyText: OpenLayers.i18n('Select a country...')
            });

            if (feature.attributes.country) {
                var countryIndex = openaddresses.countryStore.find('countryCode',feature.attributes.country);
                var record = openaddresses.countryStore.getAt(countryIndex);
                comboCountry.setValue(record.data.countryName);
            }
            
            feature.editingFormPanel = new Ext.form.FormPanel({
                border: false,
                frame: true,
                labelWidth:120,
                defaultType:'textfield',
                items:[
                    {
                        name:'created_by',
                        fieldLabel: OpenLayers.i18n('Username'),
                        allowBlank: false,
                        width: 160,
                        value: feature.attributes.created_by
                    },
                    {
                        name:'street',
                        fieldLabel: OpenLayers.i18n('Street'),
                        allowBlank: false,
                        width: 240,
                        value: feature.attributes.street
                    },
                    {
                        name:'housenumber',
                        fieldLabel: OpenLayers.i18n('House number'),
                        allowBlank: true,
                        width: 80,
                        value: feature.attributes.housenumber
                    },
                    {
                        name:'housename',
                        fieldLabel: OpenLayers.i18n('House name'),
                        allowBlank: true,
                        width: 240,
                        value: feature.attributes.housename
                    },
                    {
                        name:'postcode',
                        fieldLabel: OpenLayers.i18n('Postal code'),
                        allowBlank: true,
                        width: 80,
                        value: feature.attributes.postcode
                    },
                    {
                        name:'city',
                        fieldLabel: OpenLayers.i18n('City'),
                        allowBlank: false,
                        width: 240,
                        value: feature.attributes.city
                    },
                    {
                        name:'region',
                        fieldLabel: OpenLayers.i18n('Region'),
                        allowBlank: true,
                        width: 240,
                        value: feature.attributes.region
                    },
                        comboCountry
                ]
            });
            feature.editingPopup = new GeoExt.Popup({
                title: OpenLayers.i18n('Address Editor'),
                feature: feature,
                collapsible: false,
                closable: false,
                width: 400,
                bbar: new Ext.Toolbar({
                    items: [
                        {
                            xtype: 'tbbutton',
                            text: OpenLayers.i18n('Delete'),
                            disabled: false,
                            handler: function() {
                                alert('delete');
                            }
                        },
                        {
                            xtype: 'tbfill'
                        },
                        {
                            xtype: 'tbbutton',
                            text: OpenLayers.i18n('Cancel'),
                            disabled: false,
                            handler: function() {
                                cancelEditing(feature);
                            }
                        },
                        {
                            xtype: 'tbbutton',
                            text: OpenLayers.i18n('Save'),
                            disabled: false,
                            handler: function() {
                                alert('save');
                            }
                        }
                    ]
                }),
                items: [
                    feature.editingFormPanel
                ]
            });
            feature.editingPopup.show();
        };

        // 1. Check if an address exists at this position
        Ext.Ajax.request({
            url: 'addresses/',
            method: 'GET',
            success: function(responseObject) {
                var mapfishFeatures = eval('(' + responseObject.responseText + ')');

                // Add the modify feature control the first time
                if (!map.modifyFeatureControl) {
                    map.modifyFeatureControl = new OpenLayers.Control.ModifyFeature(vectorLayer);
                    map.addControl(map.modifyFeatureControl);
                    map.modifyFeatureControl.activate();
                }

                // Check that another feature is edited
                if (map.editedFeature) {
                    cancelEditing(map.editedFeature);
                }

                // Add the feature
                if (mapfishFeatures.features.length === 0) {
                    map.editedFeature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(clickedPosition.lon, clickedPosition.lat));
                } else {
                    var featurePosition = new OpenLayers.LonLat(mapfishFeatures.features[0].geometry.coordinates[0], mapfishFeatures.features[0].geometry.coordinates[1]);
                    featurePosition.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
                    map.editedFeature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(featurePosition.lon, featurePosition.lat));
                    var property;
                    for (property in mapfishFeatures.features[0].properties) {
                        //console.log(property + ': ' + mapfishFeatures.features[0].properties[''+property+'']);
                        map.editedFeature.attributes['' + property + ''] = mapfishFeatures.features[0].properties['' + property + ''];
                    }
                }

                vectorLayer.addFeatures(map.editedFeature);
                map.modifyFeatureControl.selectControl.select(map.editedFeature);
                map.modifyFeatureControl.selectControl.handlers.feature.feature = map.editedFeature;

                // Add the popup associated to the feature
                addPopup(map.editedFeature);
            },
            failure: function() {
                alert('Error in addresses GET query');
            },
            params: { lon: clickePositionWGS84.lon,
                lat: clickePositionWGS84.lat,
                //tolerance: 0.0001
                tolerance: 0.2
            }
        });

    },

    /** private: method[onDblclick]
     *  Not implemented
     */
    onDblclick: function(evt) {
        alert('doubleClick');
    }
});
