import React, {useCallback, useState} from "react";
import axios from "axios";
import {DeleteOutline} from "@mui/icons-material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Delete from '@mui/icons-material/Delete'
import {Button, Modal, Switch, FormControlLabel} from "@mui/material";
import './inference.css';
import 'reactflow/dist/style.css';
import InferenceNavbar from './InferenceNavbar';
import ReactFlow, {
    addEdge, applyEdgeChanges, Background, Controls, Panel, ReactFlowProvider, useEdgesState, useNodesState
} from "reactflow";
import inputSelectorNode from "./inputSelectorNode";
import ASRSelectorNode from "./ASRSelectorNode";
import MTSelectorNode from "./MTSelectorNode";
import TTSSelectorNode from "./TTSSelectorNode";
import OCRSelectorNode from "./OCRSelectorNode";
// import preprocessingSelectorNode from "./preprocessingSelectorNode";
// import classificationSelectorNode from "./classificationSelectorNode";
// import regressionSelectorNode from "./regressionSelectorNode";
// import sentimentSelectorNode from "./sentimentSelectorNode";
import SaveInferencePipelineDialog from "./SaveInferencePipelineDialog";
import ClearInferencePlaygroundDialog from "./ClearInferencePlaygroundDialog";
import {useLocation} from "react-router-dom";
import InputData from "./newInputForModal.js";

const nodeTypes = {
    inputData: inputSelectorNode, // preprocessing: preprocessingSelectorNode,
    ASR: ASRSelectorNode, MT: MTSelectorNode, TTS: TTSSelectorNode, // classification: classificationSelectorNode,
    OCR: OCRSelectorNode, // regression: regressionSelectorNode, // sentiment: sentimentSelectorNode
};

const proOptions = {hideAttribution: true};

const initialNodes = [];

let id = 0;
const getID = () => `dndnode_${id++}`;

function Inference() {
    const locationState = useLocation();

    const deleteNode = (id) => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    };

    const handleNameChange = (id, newName) => {
        setNodes((oldNodes) => {
            return oldNodes.map(node => {
                if (node.id === id) {
                    return {...node, data: {...node.data, name: newName}};
                }
                return node;
            });
        });
    };

    const handleLinkChange = (id, newLink) => {
        setNodes((oldNodes) => {
            return oldNodes.map(node => {
                if (node.id === id) {
                    return {...node, data: {...node.data, link: newLink}};
                }
                return node;
            });
        });
    };

    const handleLanguageChange = (id, newLanguage) => {
        setNodes((oldNodes) => {
            return oldNodes.map(node => {
                if (node.id === id) {
                    return {...node, data: {...node.data, language: newLanguage}};
                }
                return node;
            });
        });
    };

    const handleEdgesChange = useCallback((changes) => {
        changes.forEach(change => {
            if (change.type === 'select' && change.selected) {
                setSelectedEdge(change.id);
            } else if (change.type === 'select' && !change.selected) {
                setSelectedEdge(null);
            }
        });
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, []);

    const attachFunctionsToNode = (node) => {
        let matches = node['id'].match(/(\d+)$/);
        if (matches) {
            const node_idx = parseInt(matches[1], 10);
            id = node_idx >= id ? node_idx + 1 : id;
        }
        return {
            ...node, data: {
                ...node.data,
                onDelete: deleteNode,
                onNameChange: handleNameChange,
                onLinkChange: handleLinkChange,
                onLanguageChange: handleLanguageChange,
            }
        };
    };

    const savedNodes = locationState?.state?.nodes?.map(attachFunctionsToNode) || initialNodes;
    const reactFlowWrapper = React.useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(savedNodes);
    const [edges, setEdges] = useEdgesState(locationState?.state?.edges || []);
    const [reactFlowInstance, setReactFlowInstance] = React.useState(null);
    const [outputURL, setOutputURL] = useState(null);
    const [open, setOpen] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const defaultSaveText = locationState?.state ? "Save Edited Pipeline" : "Save Pipeline";
    const [saveButtonText, setSaveButtonText] = useState(defaultSaveText);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [mode, setMode] = useState("Automatic");
    const [newPseudoLang, setNewPseudoLang] = useState("");
    const [newPseudoLink, setNewPseudoLink] = useState("");
    const [nextNodeID, setNextNodeID] = useState(null);
    const [runButtonText, setRunButtonText] = useState("Run");
    const [errorMessage, setErrorMessage] = useState(null);
    const [manualModeNodesToBeSent, setManualModeNodesToBeSent] = useState(null);
    const [manualModeEdgesToBeSent, setManualModeEdgesToBeSent] = useState(null);
    const [isReadyToSend, setIsReadyToSend] = useState(false); // New state to trigger API call after state updates

    const handleRun = () => {
        if (mode === "Manual" && !nextNodeID) {
            setManualModeNodesToBeSent(nodes);
            setManualModeEdgesToBeSent(edges);
        }
        if (mode === "Manual" && nextNodeID) processNewInput();

        setRunButtonText("Running...");
        setButtonLoading(true);
        setIsReadyToSend(true);
    };

    React.useEffect(() => {
        if (isReadyToSend) {
            const data = {
                nodes: mode === "Manual" ? manualModeNodesToBeSent : nodes,
                edges: mode === "Manual" ? manualModeEdgesToBeSent : edges,
                mode: mode,
            };

            console.log("Nodes", data.nodes);
            console.log("Edges", data.edges);

            const callMaster = async () => {
                try {
                    const response = await axios.post(process.env.REACT_APP_RUN_INFERENCE_PIPELINE, data);
                    console.log("Received response: ", response.data);

                    if ("URL" in response.data) {
                        setOutputURL(response.data.URL);
                        if (mode === "Manual") setNewPseudoLink(response.data.URL);
                    } else {
                        setOutputURL(null);
                        if (mode === "Manual") setNewPseudoLink("");
                    }

                    if ("error" in response.data) setErrorMessage(response.data.error); else setErrorMessage(null);

                    if (mode === "Manual") {
                        setNewPseudoLang(() => {
                            const inputNodeFiltering = manualModeNodesToBeSent.filter((node) => node.type === 'inputData');
                            console.log(inputNodeFiltering)
                            const inputNodeID = inputNodeFiltering[0].id;
                            const edgesFiltering = manualModeEdgesToBeSent.filter((edge) => edge.source === inputNodeID);
                            console.log(edgesFiltering)
                            const targetNodeID = edgesFiltering[0].target;
                            const targetNodeFiltering = manualModeNodesToBeSent.filter((node) => node.id === targetNodeID);
                            console.log(targetNodeFiltering)
                            return targetNodeFiltering[0]?.data?.destinationLanguage;
                        })
                        setNextNodeID(response.data.nextNodeID);
                    }

                    setOpen(true);
                } catch (error) {
                    console.error("Error in callMaster: ", error);
                }
            };

            callMaster();
            setIsReadyToSend(false);
        }
    }, [manualModeNodesToBeSent, manualModeEdgesToBeSent, isReadyToSend, mode, nodes, edges]);

    const processNewInput = () => {
        setManualModeNodesToBeSent((nds) => {
            // remove old input node
            let nds_cpy = [...nds].filter((node) => node.type !== 'inputData');

            // add new pseudo input node
            nds_cpy.push({
                id: 'pseudoInput', type: 'inputData', data: {
                    label: "Inputs", language: newPseudoLang, link: newPseudoLink, entity: {},
                },
            });

            return nds_cpy;
        });

        setManualModeEdgesToBeSent((edgs) => {
            // remove old pseudoInput edge
            let edgs_cpy = [...edgs].filter((edge) => edge.source !== 'pseudoInput');

            // add new edge from pseudo input node to the next node
            edgs_cpy.push({
                id: `reactflow__edge-pseudoInputb-${nextNodeID}`,
                source: 'pseudoInput',
                sourceHandle: "b",
                target: nextNodeID,
                targetHandle: null,
            });

            return edgs_cpy;
        });
    };

    const handleDownloadFile = () => {
        if (outputURL) {
            const fileName = outputURL.split('/').pop();
            const link = document.createElement('a');
            link.href = outputURL;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.log("No output URL available.");
        }
    };

    const validCombinations = [{source: 'inputData', target: 'MT'}, {
        source: 'inputData',
        target: 'ASR'
    }, {source: 'inputData', target: 'TTS'}, {source: 'inputData', target: 'OCR'}, {source: 'ASR', target: 'MT'}, {
        source: 'ASR',
        target: 'TTS'
    }, {source: 'MT', target: 'MT'}, {source: 'MT', target: 'TTS'}, {source: 'TTS', target: 'ASR'}, {
        source: 'OCR',
        target: 'MT'
    }, {source: 'OCR', target: 'TTS'},];

    const validateEdgeConnection = (source, target) => {
        const sourceNode = nodes.find(node => node.id === source);
        const targetNode = nodes.find(node => node.id === target);

        console.log(sourceNode.type, targetNode.type)
        if (!sourceNode || !targetNode) {
            setErrorMessage("Invalid source or target node.");
            return false;
        }

        const isValid = validCombinations.some(combo => combo.source === sourceNode.type && combo.target === targetNode.type);

        if (!isValid) {
            alert(`${sourceNode.type} node cannot be connected to ${targetNode.type}.`);
            return false;
        }

        return true;
    };

    const onConnect = useCallback((params) => {
        const {source, target} = params;

        if (validateEdgeConnection(source, target)) {
            setEdges((eds) => addEdge(params, eds));
        } else {
            console.error("Connection validation failed.");
        }
    }, [edges, nodes]);

    // const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
    const onDragOver = useCallback((event) => {
        if (buttonLoading) return; // if pipeline is running, then prevent dropping new nodes.

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, [buttonLoading]);

    const onDrop = useCallback((event) => {
        if (buttonLoading) return; // if pipeline is running, then prevent dropping new nodes.

        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        if (typeof type === 'undefined' || !type) {
            return;
        }
        const nodeType = event.dataTransfer.getData('nodeType');
        let color;
        switch (nodeType) {
            case "inputData":
                color = "#d7e3fc";
                break;
            // case "preprocessing":
            //     color = "#efc7e5";
            //     break;
            case "ASR":
                color = "#b0f2b4";
                break;
            case "MT":
                color = "lightgrey";
                break;
            case "TTS":
                color = "#ffef9f";
                break;
            case "OCR":
                color = "orange";
                break;
            // case "classification":
            //     color = "#b0f2b4";
            //     break;
            // case "regression":
            //     color = "lightgrey";
            //     break;
            // case "sentiment":
            //     color = "#ffef9f";
            //     break;
            default:
                color = "#ffffff";
        }

        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX, y: event.clientY,
        });

        const newNode = {
            id: getID(), position, data: {
                label: `${type}`,
                entity: null,
                onDelete: deleteNode,
                onNameChange: handleNameChange,
                onLinkChange: handleLinkChange,
                onLanguageChange: handleLanguageChange,
            }, style: {backgroundColor: color}, type: nodeType
        };

        setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance, buttonLoading]);

    const handleDeleteEdge = () => {
        setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge));
        setSelectedEdge(null);
    };

    const handleSaveDialogOpen = () => {
        setIsSaveDialogOpen(true);
    }

    const handleSaveDialogClose = () => {
        setIsSaveDialogOpen(false);
    }

    const handleClearDialogOpen = () => {
        setIsClearDialogOpen(true);
    }

    const handleClearDialogClose = () => {
        setIsClearDialogOpen(false);
    }

    const handleSavePipeline = async (savedPipelineName) => {
        setSaveButtonText("Saving pipeline...");
        setIsSaveDialogOpen(false);

        if (locationState?.state) {
            const pipeline_id = locationState?.state?.pipeline_id || 0
            await axios.post(process.env.REACT_APP_SAVE_EDITED_PIPELINE, {
                nodes: nodes, edges: edges, pipeline_id: pipeline_id
            })
                .then((response) => {
                    console.log("Received response: ", response.data);
                    setSaveButtonText("Successfully edited the pipeline!");
                    locationState.state.nodes = nodes;
                    locationState.state.edges = edges;
                })
                .catch((error) => {
                    console.log(error);
                    setSaveButtonText("Failed, please try again.");
                    setTimeout(() => setSaveButtonText(defaultSaveText), 3000);
                });
        } else {
            await axios.post(process.env.REACT_APP_SAVE_PIPELINE, {
                nodes: nodes, edges: edges, pipeline_name: savedPipelineName,
            })
                .then((response) => {
                    console.log("Received response: ", response.data);
                    setSaveButtonText("Saved the pipeline!");
                })
                .catch((error) => {
                    console.log(error);
                    setSaveButtonText("Failed, please try again.");
                    setTimeout(() => setSaveButtonText(defaultSaveText), 3000);
                });
        }
    }

    const handleClearPlayground = () => {
        locationState.state = undefined;
        setIsClearDialogOpen(false);
        setNodes(initialNodes);
        setEdges([]);
    }

    const handleModeChange = () => {
        setMode((prevMode) => (prevMode === "Manual" ? "Automatic" : "Manual"));
    };

    const handleOutputModalClose = () => {
        if (mode === "Manual" && nextNodeID) setRunButtonText("Continue"); else {
            setRunButtonText("Run Again");
            setNewPseudoLang("");
            setNewPseudoLink("");
        }
        setOpen(false);
        setButtonLoading(false);
    }

    return (<div>
        <div sx={{flex: 1, flexDirection: "column"}}>
            <div style={{display: 'flex'}}>
                <InferenceNavbar style={{flex: 1}}/>
                <Modal open={open} onClose={handleOutputModalClose} style={{
                    width: "80%",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10000
                }}>
                    <div style={{backgroundColor: "#fff", padding: "20px"}}>
                        <Button onClick={handleOutputModalClose}>Close</Button>
                        {outputURL ? (<>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<FileDownloadIcon/>}
                                style={{marginLeft: '72%'}}
                                onClick={handleDownloadFile}
                                disabled={errorMessage}
                            >
                                Download
                            </Button>
                            {mode === "Manual" && nextNodeID ? (<InputData
                                id={"pseudoInput"}
                                data={{
                                    language: newPseudoLang,
                                    link: newPseudoLink,
                                    entity: {},
                                    onLinkChange: setNewPseudoLink,
                                    onLanguageChange: setNewPseudoLang,
                                }}
                            />) : null}
                        </>) : (<p>{errorMessage}</p>)}
                    </div>
                </Modal>
                <div className="dndflow"
                     style={{flex: 1, marginTop: '63px', padding: '5px', border: 'solid', height: '100vh'}}>
                    <ReactFlowProvider>
                        <div className="reactflow-wrapper" ref={reactFlowWrapper}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={handleEdgesChange}
                                onConnect={onConnect}
                                onInit={setReactFlowInstance}
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                nodeTypes={nodeTypes}
                                fitView
                                nodesDraggable={!buttonLoading}
                                nodesConnectable={!buttonLoading}
                                nodesFocusable={!buttonLoading}
                                elementsSelectable={!buttonLoading}
                                edgesUpdatable={!buttonLoading}
                                edgesFocusable={!buttonLoading}
                                proOptions={proOptions}
                            >
                                <Panel position="top-right">
                                    <h4>{locationState?.state?.pipeline_name}</h4>
                                    <FormControlLabel
                                        control={<Switch
                                            checked={mode === 'Automatic'}
                                            onChange={handleModeChange}
                                            disabled={buttonLoading}
                                            color="primary"
                                        />}
                                        label={`${mode} Mode`}
                                        labelPlacement="top"
                                    />
                                    <Button
                                        onClick={handleClearDialogOpen}
                                        variant="contained"
                                        style={{
                                            borderRadius: 36,
                                            backgroundColor: "#333333",
                                            padding: "18px 36px",
                                            fontSize: "18px",
                                            color: "#ffffff", // Change color based on disabled state
                                        }}
                                    >
                                        {"Clear"}
                                        <Delete/>
                                    </Button>
                                    <Button
                                        onClick={locationState?.state ? handleSavePipeline : handleSaveDialogOpen}
                                        variant="contained"
                                        disabled={saveButtonText !== defaultSaveText}
                                        style={{
                                            borderRadius: 36,
                                            backgroundColor: "#333333",
                                            padding: "18px 36px",
                                            fontSize: "18px",
                                            color: saveButtonText !== defaultSaveText ? "#aaaaaa" : "#ffffff", // Change color based on disabled state
                                            opacity: saveButtonText !== defaultSaveText ? 0.5 : 1, // Optional: adjust opacity for a more disabled look
                                        }}
                                    >
                                        {saveButtonText}
                                    </Button>
                                    <Button onClick={handleRun} variant="contained" disabled={buttonLoading}
                                            style={{
                                                borderRadius: 35,
                                                backgroundColor: "#333333",
                                                padding: "18px 36px",
                                                fontSize: "18px"
                                            }}>
                                        {runButtonText}
                                        <PlayArrowIcon/>
                                    </Button>
                                    {selectedEdge && (<Button onClick={handleDeleteEdge} variant="outlined" style={{
                                        borderRadius: 35,
                                        padding: "10px 20px",
                                        marginLeft: "10px",
                                        fontSize: "18px",
                                        color: "red",
                                        borderColor: "red"
                                    }}>
                                        Delete Edge
                                        <DeleteOutline/>
                                    </Button>)}
                                </Panel>
                                <SaveInferencePipelineDialog
                                    open={isSaveDialogOpen}
                                    handleClose={handleSaveDialogClose}
                                    handleSave={handleSavePipeline}
                                />
                                <ClearInferencePlaygroundDialog
                                    open={isClearDialogOpen}
                                    handleClose={handleClearDialogClose}
                                    handleClear={handleClearPlayground}
                                />
                                <Background/>
                                <Controls/>
                            </ReactFlow>
                        </div>
                    </ReactFlowProvider>
                </div>
            </div>
        </div>
    </div>);
}

export default Inference;
