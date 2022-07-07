//
//  DataManager.swift
//  PUB_applewatch WatchKit Extension
//
//  Created by Steven Phan on 2022-07-06.
//

import Foundation

struct DataPoint : Codable {
    let device_serial: String
    let timestamp: Double
    let dataType: String
    let dataValues: Array<Double>
}

struct DataPacket : Codable {
    let data: Array<DataPoint>
}

class DataHandler {
    var dataQueue: Array<DataPoint>
    let frequency: Double
    let dataType: String
    var serial: String
    
    init(frequency: Double, dataType: String, serial: String) {
        self.dataQueue = []
        self.frequency = frequency
        self.dataType = dataType
        self.serial = serial
    }
    
    func setSerial(newSerial: String) {
        self.serial = newSerial
    }
    
    func addData(val: Array<Double>) {
        let data = DataPoint(device_serial: self.serial, timestamp: NSDate().timeIntervalSince1970*1000, dataType: self.dataType, dataValues: val)
        self.dataQueue.append(data)
        if (Double(self.dataQueue.count) >= self.frequency) {
            do {
                // Send the data
                let dataToSend = DataPacket(data: self.dataQueue)
                let body = try JSONEncoder().encode(dataToSend)
                self.postData(data: body)
            } catch { print(error) }
            
            self.dataQueue = []
        }
    }
    
    func postData(data: Data) {
        if let cloudHost = Bundle.main.object(forInfoDictionaryKey: "CloudHost") as? String {
            let urlString = "https://\(cloudHost)/data/add_data"
            guard let url = URL(string: urlString) else { return }
            
            // Configure the request
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.httpBody = data
            request.addValue("application/json", forHTTPHeaderField: "Content-Type")
            
            
            // Send the data
            URLSession.shared.dataTask(with: request) { data, response, error in
            }.resume()
        }
    }
}
