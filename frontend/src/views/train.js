import React, { useEffect } from "react";
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Chip, CircularProgress, LinearProgress, TableRow } from "@mui/material";
import axios from "axios";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Table as MuiTable, TableCell } from "@mui/material";
import { makeStyles } from "@mui/styles";

import { Col, Row, Button as ReactStrapButton } from "reactstrap";
import ModelInfoComponent from "components/ModelInfo/ModelInfoComponent";
import ActiveStep0 from "components/TrainJSComponents/ActiveStep0";
import ActiveStep1 from "components/TrainJSComponents/ActiveStep1";

const useStyles = makeStyles((theme) => ({
    accordionTitle: {
        display: 'flex',
        alignItems: 'center',
    },
    accordionSummary: {
        justifyContent: 'space-between',
    },
}));

function LinearProgressWithLabel(props) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(
                    props.value,
                )}%`}</Typography>
            </Box>
        </Box>
    );
}

// LinearProgressWithLabel.propTypes = {
//     /**
//      * The value of the progress indicator for the determinate and buffer variants.
//      * Value between 0 and 100.
//      */
//     value: PropTypes.number.isRequired,
// };


function Train() {
    const [activeStep, setActiveStep] = React.useState(0);
    const [trainingMode, setTrainingMode] = React.useState('AutoML');
    const [modelType, setModelType] = React.useState('');
    // const [customModelType, setCustomModelType] = React.useState('');
    const [metricMode, setMetricMode] = React.useState('AutoSelect');
    const [metricType, setMetricType] = React.useState('');
    // const [customMetricType, setCustomMetricType] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [datasetList, setDatasetList] = React.useState([]);
    const [selectedDatasetID, setSelectedDatasetID] = React.useState('');
    // const [selectedDatasetContents, setSelectedDatasetContents] = React.useState(null);
    // const [selectedDatasetColumns, setSelectedDatasetColumns] = React.useState([]);
    const [objective, setObjective] = React.useState('');
    const [targetColumn, setTargetColumn] = React.useState('');
    const [modelName, setModelName] = React.useState('');
    const [classifierMap, setClassifierMap] = React.useState({});
    const [regressorMap, setRegressorMap] = React.useState({});
    const [sentimentMap, setSentimentMap] = React.useState({});
    const [trainingCompleted, setTrainingCompleted] = React.useState(false);
    const [trainingResponse, setTrainingResponse] = React.useState({});

    const [trainingStatus, setTrainingStatus] = React.useState({
        progress: 0,
        status: 'Initialising',
        model: '',
        estimated_time_left: 'Calculating'
    });
    const classes = useStyles();

    const steps = ['Training Options', 'Model Selection', 'Train the model'];
    const classifiers = ['Logistic Regression', 'Decision Tree', 'Random Forest', 'AdaBoost', 'Naive Bayes', 'KNN', 'SVM']
    const regressors = ['Random Forest Regressor', 'AdaBoost Regressor', 'Ridge Regression', 'Bayesian Ridge']
    const classificationMetrics = ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'AUC']
    const regressionMetrics = ['R2 Score', 'Mean Absolute Error', 'Mean Squared Error', 'Root Mean Squared Error']
    const sentimentMetrics = ['Accuracy', 'Precision', 'Recall', 'F1 Score']

    const updateStep0Variables = (data) => {
        console.log(data)
        setDatasetList(data.datasetList);
        setSelectedDatasetID(data.selectedDatasetID);
        setObjective(data.objective);
        setTargetColumn(data.targetColumn);
        setModelName(data.modelName);
    }

    const updateStep1Variables = (data) => {
        console.log(data)
        setTrainingMode(data.trainingMode);
        setModelType(data.modelType);
        setMetricMode(data.metricMode);
        setMetricType(data.metricType);
    }

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleModelTypeChange = (event) => {
        console.log(event.target.value);
        setModelType(event.target.value);
    }

    const handleMetricTypeChange = (event) => {
        console.log(event.target.value);
        setMetricType(event.target.value);
    }

    const getSelectedDatasetName = () => {
        if (selectedDatasetID == '') {
            return '';
        }
        for (var i = 0; i < datasetList.length; i++) {
            if (datasetList[i].dataset_id == selectedDatasetID) {
                return datasetList[i].dataset_name;
            }
        }
    }

    // useEffect(() => {
    //     if (localStorage.getItem('trainingResponse')) {
    //         setTrainingResponse(JSON.parse(localStorage.getItem('trainingResponse')));
    //         // setTrainingCompleted(true);
    //         setActiveStep(3);
    //     }
    // }, []);
    const REACT_APP_MAIN_SERVER = process.env.REACT_APP_MAIN_SERVER;

    useEffect(() => {

        axios.get(`${REACT_APP_MAIN_SERVER}getClassifierMap`)
            .then(response => {
                setClassifierMap(response.data);
            })
            .catch(err => {
                console.log(err);
            })

        axios.get(`${REACT_APP_MAIN_SERVER}getRegressorMap`)
            .then(response => {
                setRegressorMap(response.data);
            })
            .catch(err => {
                console.log(err);
            })
        axios.get(`${REACT_APP_MAIN_SERVER}getSentimentMap`)
            .then(response => {
                setSentimentMap(response.data);
            })
            .catch(err => {
                console.log(err);
            })
    }, [])

    const handleTraining = () => {
        // event.preventDefault();
        setTrainingCompleted(false);
        setLoading(true); // Start loading
        setTrainingStatus({
            progress: 0,
            status: 'Initialising',
            model: '',
            estimated_time_left: 'Calculating'
        })
        console.log("posting")
        console.log(process.env.REACT_APP_TRAIN_URL)
        const eventSource = new EventSource(`${REACT_APP_MAIN_SERVER}stream?channel=mychannel`);

        eventSource.onmessage = (event) => {
            console.log(event.data);
            setTrainingStatus(JSON.parse(event.data));
        };

        var sklearnModelName = '';

        if (trainingMode == 'CustomModel') {
            if (objective.toLowerCase() == 'classification') {
                sklearnModelName = classifierMap.forward_map[modelType];
            }
            else if (objective.toLowerCase() == 'sentiment') {
                sklearnModelName = sentimentMap.forward_map[modelType];
            }
            else {
                sklearnModelName = regressorMap.forward_map[modelType];
            }
        }
        console.log(modelType)
        console.log(sklearnModelName)

        axios.post(process.env.REACT_APP_TRAIN_URL, {
            'dataset_id': selectedDatasetID,
            'training_mode': trainingMode,
            'model_type': sklearnModelName,
            'objective': objective,
            'metric_mode': metricMode,
            'metric_type': metricType,
            'model_name': modelName,
            'target_column': targetColumn,
            'isUpdate': 'False'
        })
            .then((response) => {
                console.log("These are the modeldeatils", response.data)
                setTrainingResponse(response.data);
                // console.log(response.data);
                setLoading(false); // Stop loading
                setTrainingCompleted(true);
            })
            .catch((error) => {
                console.log(error);
                setLoading(false); // Stop loading
            })
    }

    return (
        <div className="content">
            <Typography>
                <Row>
                    <Col>
                        <Box style={{ justifyContent: "center", display: "flex", marginBottom: "1rem" }}>
                            <Stepper activeStep={activeStep} style={{ width: "80%", }}>
                                {steps.map((label, index) => {
                                    const stepProps = {};
                                    const labelProps = {};
                                    return (
                                        <Step key={label} {...stepProps}>
                                            <StepLabel {...labelProps}>{label}</StepLabel>
                                        </Step>
                                    );
                                })}
                            </Stepper>
                        </Box>
                        {activeStep === steps.length ? (
                            <>
                                {/* Test */}
                                {Object.keys(trainingResponse).length > 0 ? <ModelInfoComponent modelDetails={trainingResponse} /> : null}
                            </>
                        ) : (
                            <React.Fragment>
                                {activeStep === 0 ?
                                    <ActiveStep0 parentCallback={updateStep0Variables} />
                                    : null}
                                {activeStep == 1 ? <ActiveStep1 objective={objective} parentCallback={updateStep1Variables} />
                                    : null}
                                {activeStep == 2 ?
                                    <div style={{ marginTop: "1.5rem" }}>
                                        <Row className="mb-3">
                                            <Col>
                                                <Typography
                                                    variant="h5"
                                                >
                                                    Model Details
                                                </Typography>
                                            </Col>
                                        </Row>
                                        <Row className="align-items-center mb-3">
                                            <Col md="2">
                                                Dataset:
                                            </Col>
                                            <Col md="6">
                                                {getSelectedDatasetName() + ' (id: ' + selectedDatasetID + ')'}
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md="2">
                                                Model Name:
                                            </Col>
                                            <Col md="6">
                                                {modelName}
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md="2">
                                                Model Type:
                                            </Col>
                                            <Col md="6">
                                                {trainingMode == 'CustomModel' ? <> {modelType} (Manual)</> : trainingMode}
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md="2">
                                                Objective:
                                            </Col>
                                            <Col md="6">
                                                {objective}
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md="2">
                                                Target Column:
                                            </Col>
                                            <Col md="6">
                                                {targetColumn}
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md="2">
                                                Optimization Metric:
                                            </Col>
                                            <Col md="6">
                                                {metricMode == 'CustomMetric' ? <>{metricType} (Manual) </> : metricMode}
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col>
                                                <ReactStrapButton disabled={loading} onClick={handleTraining} >Start Training</ReactStrapButton>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col>
                                                {
                                                    loading ?
                                                        <>
                                                            {trainingStatus.status.toLowerCase() != 'training' ? <LinearProgress /> : null}
                                                            {trainingStatus.status == 'Training' && trainingStatus.progress < 100 ? <LinearProgressWithLabel value={trainingStatus.progress} /> : null}
                                                            <Typography variant="body2" mt="1rem">
                                                                Please wait while the model is being trained...
                                                            </Typography>
                                                        </>
                                                        : null
                                                }
                                            </Col>
                                        </Row>
                                        {
                                            loading && trainingStatus.progress == 100 ?
                                                <Row className="justify-content-center align-items-center">
                                                    <Col>
                                                        <Typography color='green' variant="h6">
                                                            Training Completed
                                                        </Typography>
                                                    </Col>
                                                </Row>
                                                : null
                                        }
                                        {
                                            loading && trainingStatus.status.toLowerCase() != 'training' ?
                                                <Row className="justify-content-center align-items-center">
                                                    <Col>
                                                        <Typography variant="subtitle1">
                                                            Current Status: {trainingStatus.status}
                                                        </Typography>
                                                    </Col>
                                                </Row>
                                                : null
                                        }
                                        {loading && trainingStatus.status.toLowerCase() == 'training' ?
                                            <Row className="justify-content-center align-items-center">
                                                <Col md="4">
                                                    <MuiTable>
                                                        <TableRow>
                                                            <TableCell>Status</TableCell>
                                                            <TableCell>{trainingStatus.status}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>Current Model</TableCell>
                                                            <TableCell>{trainingStatus.model}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>Estimated Time Left</TableCell>
                                                            <TableCell>{trainingStatus.estimated_time_left}</TableCell>
                                                        </TableRow>
                                                    </MuiTable>
                                                </Col>
                                            </Row>
                                            : null}
                                        <Row>
                                            <Col>
                                                {trainingCompleted ? <>
                                                    <Typography variant="h6" style={{ color: 'green' }}>
                                                        <CheckCircleIcon color='success' /> Training Completed Successfully.
                                                    </Typography>
                                                    Click on Finish to view the model details.
                                                </> : null}
                                            </Col>
                                        </Row>
                                    </div>
                                    : null}
                                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                                    <Button
                                        color="inherit"
                                        disabled={activeStep === 0}
                                        onClick={handleBack}
                                        sx={{ mr: 1 }}
                                    >
                                        Back
                                    </Button>
                                    <Box sx={{ flex: '1 1 auto' }} />

                                    {/* <Button onClick={handleNext}>
                                    {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                                </Button> */}
                                    {activeStep === steps.length - 1 ?
                                        <Button
                                            onClick={handleNext}
                                        // disabled={!trainingCompleted}
                                        >
                                            Finish
                                        </Button>
                                        :
                                        <Button
                                            onClick={handleNext}
                                        >
                                            Next
                                        </Button>
                                    }
                                </Box>
                            </React.Fragment>
                        )}
                    </Col>
                </Row>
            </Typography>
        </div>
    )
}

export default Train;