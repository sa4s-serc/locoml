import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button as ReactStrapButton, Alert } from "reactstrap";
import { Link } from 'react-router-dom';  // Import Link from react-router-dom
import "../assets/css/paper-dashboard.css"
import axios from 'axios';
import { Table, TableRow, TableCell, TableHead, TableBody, CircularProgress, Typography, Button } from '@mui/material';

function UploadData() {
    const fileInput = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [dataSets, setDataSets] = useState([]);  // [ {name: 'abc.csv', size: '1.2 MB'}, {name: 'xyz.csv', size: '2.3 MB'}
    const [uploadingDataset, setUploadingDataset] = useState(false);  // [ {name: 'abc.csv', size: '1.2 MB'}, {name: 'xyz.csv', size: '2.3 MB'}

    const handleFileChange = async (event) => {
        const REACT_APP_MAIN_SERVER = process.env.REACT_APP_MAIN_SERVER;
        const file = event.target.files[0];
        // console.log(file);
        setUploadingDataset(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filesize', file.size)
        formData.append('filename', file.name);

        // wait for 2 sec
        await new Promise(resolve => setTimeout(resolve, 1000));

        axios.post(`${REACT_APP_MAIN_SERVER}storeDataset`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        }).then(res => {
            console.log(res);
            setSelectedFile(file);
            axios.get(process.env.REACT_APP_GET_ALL_DATASETS_URL)
                .then(res => {
                    console.log(res);
                    setDataSets(res.data.dataset_list);
                }).catch(err => {
                    console.log(err);
                });
            setUploadingDataset(false);
        }
        ).catch(err => {
            console.log(err);
        }
        );
    };

    useEffect(() => {
        axios.get(process.env.REACT_APP_GET_ALL_DATASETS_URL)
            .then(res => {
                console.log(res);
                setDataSets(res.data.dataset_list);
            }).catch(err => {
                console.log(err);
            });
    }, [])

    const formatFileSize = (sizeInBytes) => {
        const megabytes = sizeInBytes / (1024 * 1024);
        return String(megabytes.toFixed(2) + ' MB');
    };

    function getDateFromTimestamp(timestamp) {
        console.log(timestamp)
        // get local timestamp
        var utc = new Date(timestamp.$date);
        var date = new Date(utc.getTime() + utc.getTimezoneOffset() * 60 * 1000);
        var dateString = date.toLocaleDateString();
        return dateString;
    }

    function getTimeIn12Hours(timestamp) {
        var utc = new Date(timestamp.$date);
        var date = new Date(utc.getTime() + utc.getTimezoneOffset() * 60 * 1000);
        // get timestring in 12 hours format (get only hours and minutes)
        var timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return timeString;
    }

    return (
        <>
            <div className="content">
                <Row>
                    <Col md="4">
                        <Card className="card-user half-height-card">
                            <CardBody>
                                <img
                                    alt="..."
                                    className="image-fit"
                                    src={require("assets/img/localupload.png")}
                                />
                                <div className="d-flex justify-content-center">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                        ref={fileInput}
                                    />
                                    <ReactStrapButton color="info"
                                        onClick={() => { fileInput.current.click() }}
                                    >
                                        Upload data from local machine
                                    </ReactStrapButton>
                                </div>
                                <div className="d-flex justify-content-center" style={{ fontSize: "12px" }}>
                                    Note: Only .csv files are supported
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="4">
                        <Card className="card-user half-height-card">
                            <CardBody>
                                <img
                                    alt="..."
                                    className="image-fit"
                                    src={require("assets/img/database.png")}
                                />
                                <div className="d-flex justify-content-center">
                                    <ReactStrapButton color="info">Connect to database</ReactStrapButton>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="4">
                        <Card className="card-user half-height-card">
                            <CardBody>
                                <img
                                    alt="..."
                                    className="image-fit"
                                    src={require("assets/img/apiupload.png")}
                                />
                                <div className="d-flex justify-content-center">
                                    <ReactStrapButton color="info">Fetch from API</ReactStrapButton>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {
                            uploadingDataset ?
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '20vh' }}>
                                        <CircularProgress /> <br />
                                        <Typography variant="h6" style={{ marginLeft: '10px' }}>
                                            Uploading File <br />
                                        </Typography>
                                        <Typography variant="subtitle1" style={{ marginLeft: '10px' }}>
                                            Please wait...
                                        </Typography>
                                    </div>
                                </> : null
                        }
                        {!uploadingDataset && selectedFile && (
                            <div>
                                <Alert className="notif-button">
                                    <div>
                                        <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>
                                            File: {selectedFile.name} ({formatFileSize(selectedFile.size)}) Uploaded Successfully
                                        </span>
                                    </div>
                                    <Link to="/eda" style={{ textDecoration: 'none' }}>
                                        <ReactStrapButton color="primary">Proceed to Exploratory data analysis</ReactStrapButton>
                                    </Link>
                                </Alert>
                            </div>
                        )}
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Typography variant='h6'>
                            Uploaded Datasets
                        </Typography>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Dataset ID</TableCell>
                                    <TableCell>Dataset Name</TableCell>
                                    <TableCell>Dataset Size</TableCell>
                                    <TableCell>Uploaded On</TableCell>
                                    <TableCell>Perform EDA</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dataSets.map((dataSet) => (
                                    <TableRow key={dataSet.dataset_id}>
                                        <TableCell>{dataSet.dataset_id}</TableCell>
                                        <TableCell>{dataSet.dataset_name}</TableCell>
                                        <TableCell>{formatFileSize(dataSet.dataset_size)}</TableCell>
                                        <TableCell>{dataSet.time}</TableCell>
                                        <TableCell> <Button variant="contained"> Select </Button> </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Col>
                </Row>
            </div>
        </>
    )
}

export default UploadData;
