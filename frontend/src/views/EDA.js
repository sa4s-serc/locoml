import { Typography } from "@mui/material";
import axios from "axios";
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  CardHeader,
  CardTitle,
  Table,
} from "reactstrap";

function EDA() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [datasetData, setDatasetData] = useState({
    message: "",
    columns: [],
    data: {},
    column_details: {},
  });

  useEffect(() => {
    // Get Datasets List
    axios
      .get(process.env.REACT_APP_GET_ALL_DATASETS_URL)
      .then((response) => {
        console.log(response.data);
        let dataset_list = response.data["dataset_list"];
        setDatasets(dataset_list);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleSelect = (dataset) => {
    const REACT_APP_MAIN_SERVER = process.env.REACT_APP_MAIN_SERVER;
    setSelectedDataset(dataset);
    // Perform EDA on selected dataset
    // console.log(process.env.REACT_APP_EDA_URL)
    axios
      .get(`${REACT_APP_MAIN_SERVER}eda/` + dataset.dataset_id)
      .then((response) => {
        console.log(response.data);
        setDatasetData(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <>
      <div className="content">

        <Typography>
          <Row>
            <Col md="12">
              {selectedDataset !== "" ? (
                <Card className="card-plain">
                  <CardHeader>
                    <CardTitle tag="h2">
                      {selectedDataset["dataset_name"]} (ID: {selectedDataset["dataset_id"]})
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    {/* Display column details in a table */}
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Column Name</th>
                          <th>Index</th>
                          <th>Column Type</th>
                          <th>Number of Unique Values</th>
                          <th>Mean</th>
                          <th>Standard Deviation</th>
                          <th>Median</th>
                          <th>Min</th>
                          <th>Max</th>
                          <th>Number of Missing Values</th>
                          <th>Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          Object.keys(datasetData["column_details"]).map(
                            (column_name, index) => (
                              <tr key={index}>
                                <td>{column_name}</td>
                                <td>{datasetData["column_details"][column_name]["index"]}</td>
                                <td>{datasetData["column_details"][column_name]["column_type"]}</td>
                                <td>{datasetData["column_details"][column_name]["num_unique_values"]}</td>
                                <td>{datasetData["column_details"][column_name]["mean"]}</td>
                                <td>{datasetData["column_details"][column_name]["std_dev"]}</td>
                                <td>{datasetData["column_details"][column_name]["median"]}</td>
                                <td>{datasetData["column_details"][column_name]["min"]}</td>
                                <td>{datasetData["column_details"][column_name]["max"]}</td>
                                <td>{datasetData["column_details"][column_name]["num_missing_values"]}</td>
                                <td>{datasetData["column_details"][column_name]["range"]}</td>
                              </tr>
                            )
                          )
                        }
                      </tbody>
                    </Table>
                  </CardBody>
                </Card>
              ) : (
                <Card className="card-plain">
                  <CardHeader>
                    <CardTitle tag="h2">Datasets</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Table responsive>
                      <thead className="text-primary">
                        <tr>
                          <th className="text-center" style={{ color: "black" }}>
                            Name
                          </th>
                          <th className="text-center" style={{ color: "black" }}>
                            Option
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {datasets.map((dataset, index) => (
                          <tr key={index}>
                            <td className="text-center">
                              {dataset["dataset_name"]}
                            </td>
                            <td className="text-center">
                              <Button
                                color="info"
                                onClick={() => handleSelect(dataset)}
                              >
                                Select
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </CardBody>
                </Card>
              )}
            </Col>
          </Row>
        </Typography>
      </div>
    </>
  );
}

export default EDA;
