import React, {useState, useEffect} from "react";
import {useMatch, useNavigate} from "react-router-dom";
import axios from "axios";
import {CircularProgress, Modal, Typography} from "@mui/material";
import {Button} from "antd";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {CsvToHtmlTable} from "react-csv-to-table";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import 'reactflow/dist/style.css';
import ReactFlow, {
    Background, Controls, ReactFlowProvider,
} from "reactflow";
import inputSelectorNode from "./inputSelectorNode";
import ASRSelectorNode from "./ASRSelectorNode";
import MTSelectorNode from "./MTSelectorNode";
import TTSSelectorNode from "./TTSSelectorNode";

const nodeTypes = {
    inputData: inputSelectorNode, // preprocessing: preprocessingSelectorNode,
    ASR: ASRSelectorNode, MT: MTSelectorNode, TTS: TTSSelectorNode, // classification: classificationSelectorNode,
    // regression: regressionSelectorNode, // sentiment: sentimentSelectorNode
};

const proOptions = {hideAttribution: true};

function NonInteractiveFlow({reactFlowWrapper, nodes, edges}) {
    return (
        <div className="dndflow"
             style={{flex: 1, marginTop: '63px', padding: '5px', border: 'solid', height: '50vh'}}>
            <ReactFlowProvider>
                <div className="reactflow-wrapper" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        proOptions={proOptions}
                    >
                        <Background/>
                        <Controls showInteractive={false} showFitView={false}/>
                    </ReactFlow>
                </div>
            </ReactFlowProvider>
        </div>
    );
}

function ProcessSavedPipeline() {
    const navigate = useNavigate();
    const RUN_SAVED_PIPELINE_URL = process.env.REACT_APP_RUN_SAVED_PIPELINE
    const match = useMatch("/pipeline/:pipeline_id");
    const pipeline_id = match?.params.pipeline_id.replaceAll("%20", " ");
    const [loading, setLoading] = useState(true);
    const [inferencePipeline, setInferencePipeline] = useState({
        "time": "2021-10-10T12:00:00.000Z",
        "pipeline_id": "S9NVQZ",
        "nodes": [{
            'id': '1',
            'type': 'input',
            'data': {'label': 'Start'},
            'position': {'x': 250, 'y': 5},
            'width': 150,
            'height': 40
        }],
        'edges': []
    });
    const [inputBlockList, setInputBlockList] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [csvData, setCsvData] = useState("");
    const [open, setOpen] = useState(false);
    const [showCURLCommand, setShowCURLCommand] = useState([]);
    const [showAPIEndpoint, setShowAPIEndpoint] = useState([]);
    const reactFlowWrapper = React.useRef(null);

    useEffect(() => {
        axios.get(process.env.REACT_APP_INFERENCE_PIPELINE_RETRIEVE_PIPELINE_DETAILS + `/?pipeline_id=${pipeline_id}`)
            .then(async (response) => {
                let data = response.data;
                if (typeof response.data === "string") data = JSON.parse(data);
                console.log(data);
                setInferencePipeline(data);
                setLoading(false);

                const inputDataNodes = data.nodes
                    .map((node, index) => ({...node, index}))
                    .filter(node => node.type === 'inputData')
                    .map(node => ({
                        index: node.index,
                        id: node.id,
                        name: (node.data.hasOwnProperty('name') ? node.data.name : ""),
                        uploadedFileName: "",
                        fileInput: React.createRef()
                    }));
                setInputBlockList(inputDataNodes);
                setShowCURLCommand(new Array(inputDataNodes.length).fill(false));
                console.log(inputDataNodes);
            })
            .catch((error) => {
                console.log(error);
            })
    }, [pipeline_id]);

    const processGivenInput = async (event, index) => {
        const file = event.target.files[0];

        const formData = new FormData();
        formData.append('file', file);
        formData.append('filesize', file.size);
        formData.append('filename', file.name);
        formData.append('nodeid', inputBlockList[index].id);

        await axios.post(process.env.REACT_APP_MASTER_SERVER_GET_INPUT_FILE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        }).then(res => {
            console.log(res);
            setInputBlockList((prevState) => {
                const newState = [...prevState];
                newState[index].uploadedFileName = file.name;
                return newState;
            });
            setInferencePipeline((prevState) => {
                const newState = {...prevState};
                newState.nodes[inputBlockList[index].index].data.entity = formData;
                return newState;
            });
        }).catch(err => {
            console.log(err);
        });
    };

    const handleRun = async () => {
        const nodes = inferencePipeline.nodes;
        const edges = inferencePipeline.edges;
        console.log("Nodes", nodes);
        console.log("Edges", edges);
        setIsRunning(true);

        const callMaster = async () => {
            await axios.post(process.env.REACT_APP_RUN_INFERENCE_PIPELINE, {
                nodes: nodes,
                edges: edges
            })
                .then((response) => {
                    console.log("Received response: ", typeof (response.data));
                    setCsvData(response.data);
                    setOpen(true);
                    setIsRunning(false);
                })
                .catch((error) => {
                    console.log(error);
                });
        };

        await callMaster();
    };

    const handleDownloadBatch = () => {
        const csvDownload = new Blob([csvData], {type: 'text/csv'});
        const url = window.URL.createObjectURL(csvDownload);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'predictions.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyText = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.log('Failed to copy: ', err);
        });
    };

    const toggleCurlCommandVisibility = (index) => {
        setShowCURLCommand((prev) => {
            const newState = [...prev];
            newState[index] = !newState[index];
            return newState;
        });
    };

    const toggleAPIEndpointVisibility = (index) => {
        setShowAPIEndpoint((prev) => {
            const newState = [...prev];
            newState[index] = !newState[index];
            return newState;
        });
    }

    const handleEditClick = () => {
        navigate(`/inference`, {
            state: {
                'pipeline_name': inferencePipeline['pipeline_name'],
                'pipeline_id': inferencePipeline['pipeline_id'],
                'nodes': inferencePipeline['nodes'],
                'edges': inferencePipeline['edges']
            }
        });
    };

    return (
        <div className="content">
            {loading ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '70vh'
                }}>
                    <CircularProgress/> <br/>
                    <Typography variant="h6" style={{marginLeft: '10px'}}>
                        Fetching Details of Pipeline with ID: {pipeline_id} <br/>
                    </Typography>
                    <Typography variant="subtitle1" style={{marginLeft: '10px'}}>
                        Please wait...
                    </Typography>
                </div>
            ) : (
                <>
                    <h2>{inferencePipeline.pipeline_name}</h2>
                    {inputBlockList.map((inputBlock, index) => (
                        <div key={index}>
                            {inputBlock.name === "" ? `ID: ${inputBlock.id}` : `Name: ${inputBlock.name}`}
                            <input
                                type="file"
                                accept=".csv"
                                style={{display: 'none'}}
                                onChange={(event) => processGivenInput(event, index)}
                                ref={inputBlock.fileInput}
                            />
                            {/*<Button*/} {/* TODO: reinstate this once you add a box to give URL as input */}
                            {/*    style={{*/}
                            {/*        height: "40px", fontSize: "20px", marginTop: "2px", marginBottom: "2px",*/}
                            {/*        display: "flex", justifyContent: "center", alignItems: "center",*/}
                            {/*        backgroundColor: "#f5f5f5", color: "#222222",*/}
                            {/*    }}*/}
                            {/*    onClick={() => {*/}
                            {/*        inputBlock.fileInput.current.click();*/}
                            {/*    }}*/}
                            {/*>*/}
                            {/*    {inputBlock.uploadedFileName !== "" ? `Uploaded: ${inputBlock.uploadedFileName}` : 'Upload Dataset'}*/}
                            {/*</Button>*/}
                            <Button
                                style={{
                                    height: "40px", fontSize: "20px", marginTop: "2px", marginBottom: "2px",
                                    display: "flex", justifyContent: "center", alignItems: "center",
                                    backgroundColor: "#f5f5f5", color: "#222222",
                                    marginLeft: '10px'
                                }}
                                onClick={() => toggleCurlCommandVisibility(index)}
                            >
                                {showCURLCommand[index] ? 'Hide cURL Command' : 'Show cURL Command'}
                            </Button>
                            {showCURLCommand[index] && (
                                <div style={{display: 'flex', alignItems: 'center', marginTop: '10px'}}>
                                    <div style={{
                                        border: '1px solid #ccc',
                                        padding: '10px',
                                        overflowX: 'scroll',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '600px',
                                        marginRight: '10px'
                                    }}>
                                        curl -X POST
                                        -F {"file=@<input_dataset_path>"} {RUN_SAVED_PIPELINE_URL}{pipeline_id} --output
                                        output
                                    </div>
                                    <Button
                                        onClick={() => handleCopyText(`curl -X POST -F "file=@<input_dataset_path>" ${RUN_SAVED_PIPELINE_URL}${pipeline_id} --output output`)}
                                    >
                                        <ContentCopyIcon/>
                                    </Button>
                                </div>
                            )}
                            <Button
                                style={{
                                    height: "40px", fontSize: "20px", marginTop: "2px", marginBottom: "2px",
                                    display: "flex", justifyContent: "center", alignItems: "center",
                                    backgroundColor: "#f5f5f5", color: "#222222",
                                    marginLeft: '10px'
                                }}
                                onClick={() => toggleAPIEndpointVisibility(index)}
                            >
                                {showAPIEndpoint[index] ? 'Hide API Endpoint' : 'Show API Endpoint'}
                            </Button>
                            {showAPIEndpoint[index] && (
                                <div style={{display: 'flex', alignItems: 'center', marginTop: '10px'}}>
                                    <div style={{
                                        border: '1px solid #ccc',
                                        padding: '10px',
                                        overflowX: 'scroll',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '600px',
                                        marginRight: '10px'
                                    }}>
                                        {RUN_SAVED_PIPELINE_URL}{pipeline_id}
                                    </div>
                                    <Button
                                        onClick={() => handleCopyText(`${RUN_SAVED_PIPELINE_URL}${pipeline_id}`)}
                                    >
                                        <ContentCopyIcon/>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    <Button
                        style={{
                            height: "40px", fontSize: "20px", marginTop: "2px", marginBottom: "2px",
                            display: "flex", justifyContent: "center", alignItems: "center",
                            backgroundColor: "#f5f5f5", color: "#222222",
                            marginLeft: '10px'
                        }}
                        onClick={() => handleEditClick()}
                    >
                        {'Edit Pipeline'}
                    </Button>
                    <Modal open={open} onClose={() => setOpen(false)} style={{
                        width: "80%",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)"
                    }}>
                        <div style={{backgroundColor: "#fff", padding: "20px"}}>
                            <CsvToHtmlTable
                                data={csvData.split('\n').slice(0, 10).join('\n')}
                                csvDelimiter=","
                                tableClassName="table table-striped table-hover"
                            />
                            <Button onClick={() => setOpen(false)}>Close</Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<FileDownloadIcon/>}
                                style={{marginLeft: '72%'}}
                                onClick={handleDownloadBatch}
                            >
                                Download
                            </Button>
                        </div>
                    </Modal>
                    <h4>Preview:</h4>
                    <NonInteractiveFlow nodes={inferencePipeline['nodes']} edges={inferencePipeline['edges']}
                                        reactFlowWrapper={reactFlowWrapper}/>
                    {/*<Button*/} {/* TODO: reinstate this once you add a box to give URL as input */}
                    {/*    onClick={handleRun}*/}
                    {/*    variant="contained"*/}
                    {/*    disabled={isRunning}*/}
                    {/*    style={{*/}
                    {/*        borderRadius: 35,*/}
                    {/*        backgroundColor: "#333333",*/}
                    {/*        marginTop: '20px',*/}
                    {/*        padding: "18px 36px",*/}
                    {/*        fontSize: "18px",*/}
                    {/*        display: 'flex',*/}
                    {/*        alignItems: 'center',*/}
                    {/*        justifyContent: 'center'*/}
                    {/*    }}*/}
                    {/*>*/}
                    {/*    {isRunning ? "Running..." : "Run"}*/}
                    {/*    <PlayArrowIcon style={{ marginLeft: '8px' }} />*/}
                    {/*</Button>*/}
                </>
            )}
        </div>
    );
}

export default ProcessSavedPipeline;