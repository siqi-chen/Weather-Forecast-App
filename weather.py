#-*-coding:utf-8-*-

from flask import Flask, jsonify, render_template, Response, request
from flask_restful import Resource, Api, reqparse, abort
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn import linear_model


app = Flask(__name__)
api = Api(app)

# Read csv file
df = pd.read_csv("daily.csv", dtype={"DATE": np.str})
table = df.to_dict(orient="records")


def get_record_by_date(date):
 # Find record by date from the dataset
    for record in table:
        if record.get("DATE") == date:
            return record
    return None


def find_previous_year_in_record(date):
    # Find previous year in the record if a future date is given
    if get_record_by_date(date) == None:
        date = list(date)
        if date[3] != '0':
            date[3] = str(int(date[3]) - 1)  # change year
            date = ''.join(date)
            return find_previous_year_in_record(date)
        else:
            date[2] = str(int(date[2]) - 1)  # change year
            date[3] = '9'
            date = ''.join(date)
            return find_previous_year_in_record(date)
    else:
        return date


def get_six_days_weather(date):
    # Get seven-day's weather by giving a date in the record
    previous_6_tmax = []
    previous_6_tmin = []
    for day in range(6):
        date = datetime.strptime(date, '%Y%m%d') - timedelta(days=1)
        date = date.strftime('%Y%m%d')
        record = get_record_by_date(date)
        previous_6_tmax.append(record["TMAX"])
        previous_6_tmin.append(record["TMIN"])

    return previous_6_tmax, previous_6_tmin


def predict_temperature(date, previous_6_tmax, previous_6_tmin):
    # Generate random temperatures based on previous weather
    days = [i for i in range(12)]
    forecast = []

    # Create linear regression object
    regr = linear_model.LinearRegression()
    # Train the model using the training sets
    regr.fit(np.reshape(days[:6], (-1, 1)), np.reshape(previous_6_tmax, (-1, 1)))
    # Make predictions using the testing set
    forecast_max = regr.predict(np.reshape(days[6:], (-1, 1)))

    regr.fit(np.reshape(days[:6], (-1, 1)), np.reshape(previous_6_tmin, (-1, 1)))
    forecast_min = regr.predict(np.reshape(days[6:], (-1, 1)))

    for i in range(0, 6):
        forecast.append({"DATE": date, "TMAX": forecast_max[i, 0], "TMIN": forecast_min[i, 0]})
        date = datetime.strptime(date, '%Y%m%d') + timedelta(days=1)
        date = date.strftime('%Y%m%d')

    return forecast


parser = reqparse.RequestParser()
parser.add_argument("DATE", type=str, required=True, help="Invalid Date")
parser.add_argument("TMAX", type=float, required=True, help="Invalid Temperature")
parser.add_argument("TMIN", type=float, required=True, help="Invalid Temperature")


class WeatherList(Resource):

    def get(self):
        results = []
        for row in table:
            results.append({"DATE": row.get("DATE")})
        return Response(json.dumps(results), mimetype='application/json')

    def post(self):
        args = parser.parse_args()
        date, tmax, tmin = args["DATE"], args["TMAX"], args["TMIN"]
        table.append(args)
        return {'DATE': str(date)}, 201


class Weather(Resource):

    # date = request.form['date']

    def get(self, date):
        record = get_record_by_date(date)
        if record == None:
            abort(404)
        else:
            return jsonify(DATE=record["DATE"],
                           TMAX=record["TMAX"], TMIN=record["TMIN"])

    def delete(self, date):
        record = get_record_by_date(date)
        if record:
            table.remove(record)
        return {"message": "Deleted"}


class Forecast(Resource):

    def get(self, date):
        if get_record_by_date(date) == None:
            # find previous years weather
            previous_date = find_previous_year_in_record(date)
            previous_6_tmax, previous_6_tmin = get_six_days_weather(previous_date)
            predictions = predict_temperature(date, previous_6_tmax, previous_6_tmin)
            return predictions
        else:
            # generate data based on previous day
            previous_6_tmax, previous_6_tmin = get_six_days_weather(date)
            return predict_temperature(date, previous_6_tmax, previous_6_tmin)



# add_resource function registers the routes with the framework using the given endpoint
api.add_resource(WeatherList, "/api/historical", "/api/historical/")
api.add_resource(Weather, "/api/historical/<string:date>")
api.add_resource(Forecast, "/api/forecast/<string:date>")


@app.route('/', methods=['GET', 'POST'])
def homepage():
    return render_template("index.html")


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
