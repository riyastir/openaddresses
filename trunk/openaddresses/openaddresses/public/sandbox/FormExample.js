/*!
 * Ext JS Library 3.1.1
 * Copyright(c) 2006-2010 Ext JS, LLC
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.onReady(function() {

    Ext.QuickTips.init();

    /*
     * ================  Simple form  =======================
     */


    var simple = new Ext.FormPanel({
        labelWidth: 75, // label settings here cascade unless overridden
        url:'save-form.php',
        frame:true,
        title: 'Simple Form',
        bodyStyle:'padding:5px 5px 0',
        width: 350,
        defaults: {width: 230},
        defaultType: 'textfield',

        items: [
            {
                fieldLabel: 'First Name',
                name: 'first',
                allowBlank:false,
                qtip: 'hello'
            },
            {
                fieldLabel: 'Last Name',
                name: 'last',
                qtip: 'world'
            },
            {
                fieldLabel: 'Company',
                name: 'company'
            },
            {
                fieldLabel: 'Email',
                name: 'email',
                vtype:'email'
            },
            new Ext.form.TimeField({
                fieldLabel: 'Time',
                name: 'time',
                minValue: '8:00am',
                maxValue: '6:00pm'
            })
        ],

        buttons: [
            {
                text: 'Save'
            },
            {
                text: 'Cancel'
            }
        ]
    });

    simple.render(document.body);
    simple.getForm().isValid();
});