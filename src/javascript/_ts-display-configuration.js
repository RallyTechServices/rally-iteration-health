Ext.define('Rally.technicalservices.healthConfiguration',{
    mixins: {
        observable: 'Ext.util.Observable'
    },
    logger: new Rally.technicalservices.Logger(),
    /**
     * Configurations set by the app
     */
    usePoints: true,
    hideTaskMovementColumn: false,
    appId: undefined,
    useSavedRanges: false,
    showDateForHalfAcceptanceRatio: false,
    skipZeroForEstimationRatio: true,

    /**
     * Colors for Cell Renderers
     */
    red: '#ff9999',
    yellow: '#ffffcc',
    green: '#ccffcc',
    grey: '#D0D0D0',
    benchmarkGreen: 90,
    benchmarkField: '__ratioEstimated',
    defaultRange: { red: 0, yellow: 60, green: 90, direction: 'red,yellow,green' },

    /**
     * Display settings for column names, whether or not to display columns,
     * tooltips and default ranges
     */
    displaySettings: {
        Name: {
            display: true
        },
        StartDate: {
            display: true,
            displayName: 'Start Date'
        },
        EndDate: {
            display: true,
            displayName: 'End Date'
        },
        __days: {
            display: true,
            displayName: '# Days'
        },

        __ratioEstimated: {
            display: true,
            displayName: 'Estimation Ratio (Current)',
            range: { red: 0, yellow: 60, green: 90, direction: 'red,yellow,green'},
            tooltip: 'Estimation Ratio Tooltip'
        },
        __ratioInProgress: {
            display: true,
            range: { green: 0, yellow: 25, red: 35, direction: 'green,yellow,red'},
            displayName: 'Average Daily In-Progress'
        },
        __halfAcceptedRatio: {
            display: true,
            range: { green: 0, yellow: 50, red: 75, direction: 'green,yellow,red'},
            displayName: '50% Accepted Point'
        },
        __halfAcceptedDate: {
            display: false,
            displayName: "50% Accepted Date"
        },
        __endCompletionRatio: {
            display: true,
            range: { red: 0, yellow: 95, green: 100, direction: 'red,yellow,green'},
            displayName: 'Last Day Completion Ratio'
        },
        __endIncompletionRatio: {
            display: false,
            range: { green: 0, yellow: 5, red: 10, direction: 'green,yellow,red'},
            displayName: "Last Day Incompletion Ratio"
        },
        __endAcceptanceRatio: {
            display: true,
            displayName: 'Last Day Acceptance Ratio',
            range: { red: 0, yellow: 50, green: 91, direction: 'red,yellow,green'}
        },
        __scopeChurn: {
            display: true,
            displayName: 'Scope Churn'
        },
        __taskChurn: {
            display: true,
            displayName: 'Task Churn'
        }
    },

    constructor: function(config){
        Ext.apply(this, config);
        if (config.hideTaskMovementColumn){
            this.displaySettings.__taskChurn.display = false;
        }
        this.mixins.observable.constructor.call(this, config);

        this.addEvents(
            'rangechanged'
        );


        //Get settings and preferences here
        //if (this.getAppId() && this.getSetting('useSavedRanges')){
        //    Rally.technicalservices.WsapiToolbox.fetchPreferences(this.getAppId()).then({
        //        scope: this,
        //        success: function(prefs){
        //            this.logger.log("preferences",prefs);
        //            if ( prefs && prefs['rally-tech-services-ranges'] ) {
        //                this.savedRanges = Ext.JSON.decode(prefs['rally-tech-services-ranges']);
        //                this.logger.log("savedRanges", this.savedRanges);
        //            }
        //            this._definePageDisplay();
        //        }
        //    });
        //} else {

    },
    getRenderer: function(field,v,m,r,r_idx, c_idx){
        if (field == 'StartDate' || field == 'EndDate'){
            field = 'shortDate';
        }

        if (this.renderers[field]){
            return this.renderers[field];
        }
        return this.renderers.defaultRenderer;
    },
    renderers: {
        defaultRenderer: function(v,m,r){
            return v;
        },
        shortDate: function(value) {
            if (value && !isNaN(Date.parse(value))){
                value = new Date(value);
                return Rally.util.DateTime.formatWithNoYearWithDefault(value);
            }
            return "";
        },
        __ratioEstimated: function(value,metaData,record){
            if (!this.usePoints){
                return "N/A";
            }
            if ( value < 0 ) {
                return " ";
            }
            var percent = parseInt( 100 * value, 10 );
            var ranges = this.displaySettings.__ratioEstimated.range || this.defaultRange;

            var color = this.red;
            if ( percent > ranges.yellow ) {
                color = this.yellow;
            }
            if ( percent > ranges.green ) {
                color = this.green;
            }

            metaData.style = 'background-color:'+color;
            return percent + "%";
        },
        __ratioInProgress: function(value,metaData,record) {
            var percent = parseInt( 100 * value, 10),
                ranges = this.displaySettings.__ratioInProgress.range,
                color = this.renderers.getRangeColor(percent,record, ranges, this);

            if (color){
                metaData.style = "background-color: " + color;
            }
            return percent + "%";
        },
        __halfAcceptedRatio: function(value,metaData,record) {
            var ranges = this.displaySettings.__halfAcceptedRatio.range;
            var color = this.green;

            if ( value < 0 ) {
                return " ";
            }
            var percent = parseInt( 100 * value, 10),
                text = "Never";

            if (percent < 200) {
                if (this.showDateForHalfAcceptanceRatio){
                    var date = record.get('__halfAcceptedDate');
                    text = Ext.String.format('{0} ({1})%',this.renderers.shortDate(date), percent);
                } else {
                    text = Ext.String.format('{0}%',percent);
                }
            }

            color = this.renderers.getRangeColor(percent,record, ranges, this);
            metaData.style = "background-color: " + color;
            return text;
        },
        getRangeColor: function(percent, record, ranges, config, check_grey){
            var should_be_grey = (check_grey && config.renderers.shouldBeGrey(config,record)),
                color_range = ranges.direction.split(',');

            if (should_be_grey){
                return config.grey;
            }

            var color_code = color_range[0];
            Ext.each(color_range, function(c){
                if (percent > ranges[c]){
                    color_code = c;
                }
            });

            if ( percent == 200 ) {
                color_code = "white";
            }

            return config[color_code];

        },
        shouldBeGrey: function(config, record){
            var check_percent = record.get(config.benchmarkField) * 100;
            return (check_percent < config.benchmarkGreen && config.usePoints);
        },
        __endCompletionRatio: function(value,metaData,record) {
            if ( value < 0 ) {
                return " ";
            }
            var ranges = this.displaySettings.__endCompletionRatio.range,
                percent = parseInt( 100 * value, 10),
                text = ( percent == 200 ) ? "No Data" : (percent + "%");


            var color = this.renderers.getRangeColor(percent,record,ranges,this,true);

            metaData.style = "background-color: " + color;
            return text;
        },
        __endAcceptanceRatio: function(value,metaData,record) {
            if ( value < 0 ) {
                return " ";
            }
            var percent = parseInt( 100 * value, 10 );
            var text = ( percent == 200 ) ? "No Data" : (percent + "%");
            var ranges = this.displaySettings.__endAcceptanceRatio.range;


            var color = this.renderers.getRangeColor(percent, record, ranges, this, true);

            metaData.style = "background-color: " + color;

            return text;
        },
        __scopeChurn: function(value,metaData,record) {

            var color = this.renderers.shouldBeGrey(this,record) ? this.grey : "white";

            var direction = 1,
                icon_string = "";
            if (value != 0){
                direction = value/Math.abs(value);
                var icon = direction < 0 ? "icon-arrow-down" : "icon-arrow-up" ; //"<img src='/slm/mashup/1.11/images/plus.gif' title='up'>";
                icon_string = Ext.String.format('<div class= "control {0}" style:="display:inline;"></div>&nbsp;', icon);
            }

            var percent = parseInt( 100 * Math.abs(value), 10 );

            metaData.style = "background-color: " + color;

            var icon = "icon-arrow-up" ; //"<img src='/slm/mashup/1.11/images/plus.gif' title='up'>";
            if (direction < 0){
                icon = "icon-arrow-down";
            }
            return Ext.String.format('<div style="text-align:center;background-color:{0};">{2}&nbsp;{1}%</div>',color,percent,icon_string);
        },
        __taskChurn: function(value,metaData,record) {
            var text = "No data";
            var color = this.renderers.shouldBeGrey(this,record) ? this.grey : "white";

            if ( value >= 0 ) {
                var percent = parseInt( 100 * value, 10 );
                text = percent + "%";
            }
            metaData.style = "background-color: " + color;
            return "<div style='text-align:center;background-color:" + color + ";'>" + text + "</div>";
        }

    },
    getRangeColors: function(range){
        var colors = range.direction.split(',');
        return colors.slice(-2);
    },
    getRangeLabel: function(range){
        var colors = range.direction.split(',');
        return Ext.String.format('Range ({0})', colors.join('/'));
    },
    setRanges: function(name, range){
        this.logger.log('setRanges', name, range);
        //TODO: save ranges
        this.fireEvent('rangechanged');
    },
    getTooltip: function(name){
        if (this.displaySettings[name]){
            return this.displaySettings[name].tooltip || this.displaySettings[name].displayName || name;
        }
        return name;
    }
});

