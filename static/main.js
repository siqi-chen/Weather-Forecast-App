$(document).ready(function(){

    var base_url = 'http://ec2-52-14-203-63.us-east-2.compute.amazonaws.com:5000';

    // var plot_data = [];

    /********** Get All Data **********/
    $('#search_all_button').click(function(){
        $.ajax({
            type:'GET',
            crossDomain: true,
            url: base_url + '/api/historical',
            success: function(records){
                $('#all_dates').append('<p>All available dates:</p>');

                $.each(records, function(i, record){
                    $('#historical_result').append('<li>' + format_date(record.DATE) + '</li>');

                });
            },
            error: function(){
                alert('error loading orders');
            }
        });
    });

    /********** Search for Particular Date **********/
    $('#search_button').click(function(){
        $.ajax({
            type:'GET',
            crossDomain: true,
            url: base_url + '/api/historical/' + date_to_string($('#date1').val()),
            dataType: 'json',
            success: function(record){
                $('#search_result').append('<li>Date: ' + format_date(record.DATE) + ', Max Temperature: ' + record.TMAX +  ', Min Temperature: ' + record.TMIN + '</li>');
            },
            error: function(){
                alert('get data error');
            }
        });
    });



    /********** Upload Information for Particular Date **********/
    $('#add_button').click(function(){

        var new_data = JSON.stringify({
            "DATE":date_to_string($('#date2').val()),
            "TMIN":+$('#tmin2').val(),
            "TMAX":+$('#tmax2').val(),
        });

        $.ajax({
            type: 'POST',
            crossDomain: true,
            url: base_url + '/api/historical',
            data: new_data,
            dataType:'json',
            contentType: 'application/json; charset=utf-8',
            success: function(newData){
                var date = newData.DATE;

                $('#post_result').append('<li>Date: ' + format_date(date) + '  Uploaded!' + '</li>');
            },
            error: function(e){
                alert('error loading orders');
            }
        });
    });


    /********** Predict Weather **********/
    $('#predict_button').click(function(){

        var data_date = [];
        var data_tmax = [];
        var data_tmin = [];


        $.ajax({
            type:'GET',
            crossDomain: true,
            url: base_url + '/api/forecast/' + date_to_string($('#date3').text()),
            dataType: 'json',
            success: function(records){

                $('#my_prediction').append('<p>My Prediction:</p>');

                $.each(records, function(i, record){
                    $('#my_predict_result').append('<li>Date: ' + format_date(record.DATE) + ', Max Temperature: ' + parseFloat(record.TMAX).toFixed(2) +  ', Min Temperature: ' + parseFloat(record.TMIN).toFixed(2) + '</li>');

                    var record_max = [i, record.TMAX];
                    var record_min = [i, record.TMIN];

                    data_tmax.push(record_max);
                    data_tmin.push(record_min);

                    data_date.push([i, format_date(record.DATE)]);
                });

                var data = [
                {
                    label:'Max Temperature - My Prediction',
                    data:data_tmax
                },
                {
                    label:'Min Temperature - My Prediction',
                    data:data_tmin
                }
                ];

                // plot_data = data;

                var options = {
                    legend: {
                        show: true,
                        margin: 10,
                        backgroundOpacity: 0.5,
                    },
                    points: {
                        show: true,
                        radius: 3
                    },
                    lines: {
                        show: true
                    },
                    xaxis: {
                        ticks: data_date,
                        tickDecimals: 0,
                        tickSize: 1,
                        axisLabel: "Date",
                    },
                    yaxis: {
                        axisLabel: "Temperature (F)",
                    }

                };

                var plotarea = $("#plotarea1");
                plotarea.css("height", "300px");
                plotarea.css("width", "500px");
                $.plot(plotarea, data, options);
            },
            error: function(){
                alert('get data error');
            }
        });
    });



    /********** Fetch Data from Weather API **********/
    $('#get_weather_button').click(function(){

        var api_date = [],
            api_tmax = [],
            api_tmin = [];
        var tmp_date = "",
            date_time = "",
            date = "";
        var date_tmax = 0,
            date_tmin = 0,
            tmp_tmax = 0,
            tmp_tmin = 0;

        $.ajax({
            type:'GET',
            url: 'http://api.openweathermap.org/data/2.5/forecast?id=4508722&&units=imperial' + '&APPID=de1e2a573b498c38c00e43518f063123', //id=4508722,Cincinnati
            dataType: 'jsonp',
            success: function(data){

                $('#others_prediction').append("<p>OpenWeatherMap's Prediction:</p>");


                var records = data['list'];

                $.each(records, function(i, record){

                    date_time = record['dt_txt'].split(' ');
                    date = date_time[0];

                    // if (date != date_to_string($('#date3').text())) {

                        date_tmax = record['main']['temp_max'];
                        date_tmin = record['main']['temp_min'];

                        if (tmp_date == "") {
                            tmp_date = date;
                            tmp_tmax = date_tmax;
                            tmp_tmin = date_tmin;
                        } else if (date == tmp_date) {
                            if (date_tmax > tmp_tmax) {
                                tmp_tmax = date_tmax;
                            }
                            if (date_tmin < tmp_tmin) {
                                tmp_tmin = date_tmin;
                            }
                         } else if (date != tmp_date) {
                            api_date.push(tmp_date);
                            api_tmax.push(tmp_tmax);
                            api_tmin.push(tmp_tmin);
                            tmp_date = date;
                            tmp_tmax = date_tmax;
                            tmp_tmin = date_tmin;
                            };

                    // }
                });

                api_date.push(tmp_date);
                api_tmax.push(tmp_tmax);
                api_tmin.push(tmp_tmin);


                for (i = 0; i < api_tmax.length; i++) {
                    $('#others_predict_result').append('<li>Date: ' + api_date[i] + ', Max Temperature: ' + api_tmax[i] +  ', Min Temperature: ' + api_tmin[i] + '</li>');
                };

                var date_for_plot = [],
                    tmax_for_plot = [],
                    tmin_for_plot = [];
                for (i = 0; i < api_date.length; i++) {
                    date_for_plot.push([i, api_date[i]]);
                    tmax_for_plot.push([i, api_tmax[i]]);
                    tmin_for_plot.push([i, api_tmin[i]]);
                };

                var data = [
                    {
                        label:'Max Temperature - OpenWeatherMap',
                        data:tmax_for_plot
                    },
                    {
                        label:'Min Temperature - OpenWeatherMap',
                        data:tmin_for_plot
                    }
                    ];

                var options = {
                    legend: {
                        show: true,
                        margin: 10,
                        backgroundOpacity: 0.5,
                    },
                    points: {
                        show: true,
                        radius: 3
                    },
                    lines: {
                        show: true
                    },
                    xaxis: {
                        ticks: date_for_plot,
                        tickDecimals: 0,
                        tickSize: 1,
                        axisLabel: "Date",
                    },
                    yaxis: {
                        axisLabel: "Temperature (F)",
                    }

                };

                var plotarea = $("#plotarea2");
                plotarea.css("height", "300px");
                plotarea.css("width", "500px");
                $.plot(plotarea, data, options);

            },
            error: function(){
                alert('get data error');
            }
        });
    });

});


// Helper function to serialize all the date type into a string
function date_to_string(date) {
    var d = date.split('-');
    day = d[2];
    month = d[1];
    year = d[0];
    var out = [year,month,day].join('')
    return out;
}

// Helper function to format date
function format_date(date) {
    return (date.slice(0,4) + '-' + date.slice(4,6) + '-' + date.slice(6,8));
}


