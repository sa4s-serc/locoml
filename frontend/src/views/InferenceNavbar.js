import React from "react";
import {List, ListItem, ListItemIcon, ListItemText, Collapse} from "@mui/material";
import {ExpandLess, ExpandMore, Folder, InsertDriveFile} from "@mui/icons-material";
import Description from '@mui/icons-material/Description';
import DatasetLinkedOutlinedIcon from '@mui/icons-material/DatasetLinkedOutlined';

function InferenceNavbar(props) {
    const [modelsOpen, setModelsOpen] = React.useState(false);

    const toggleModels = () => {
        setModelsOpen(!modelsOpen);
    };

    const onDragStart = (event, nodeName, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeName);
        event.dataTransfer.setData('nodeType', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }

    return (
        <List component="nav" sx={{
            marginTop: '63px',
            width: '20%',
            color: 'black',
            backgroundColor: 'white',
            height: '100vh',
            overflow: 'auto'
        }}>
            <List component="div" sx={{pl: 2, pr: 4}}>
                {/* {Object.keys(props.data.datasets).map((datasetId) => ( */}
                <ListItem onDragStart={(event) => onDragStart(event, "Inputs", "inputData")} draggable sx={{
                    backgroundColor: "#d7e3fc",
                    // padding: "18px 36px",
                    // margin: "10px 0",
                    borderRadius: '10px',
                    margin: '10px',
                    border: "solid 0.2px darkgrey"

                }}>
                    <ListItemIcon>
                        <DatasetLinkedOutlinedIcon/>
                    </ListItemIcon>

                    <ListItemText primary={"Input"}/>
                </ListItem>
                {/* ))} */}
            </List>
            {/* </Collapse> */}

            {/* Preprocessing */}
            {/* <ListItem button onClick={togglePreprocessing}>
                        <ListItemIcon>
                            <Folder />
                        </ListItemIcon>
                        <ListItemText primary="Preprocessing" />
                        {preprocessingOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItem> */}
            {/* <Collapse in={preprocessingOpen} timeout="auto" unmountOnExit> */}
            {/*<List component="div" disablePadding sx={{ pl: 2, pr: 4 }}>*/}
            {/*    /!* {props.data.preprocessing.map((preprocess) => ( *!/*/}
            {/*        <ListItem onDragStart={(event) => onDragStart(event, "Preprocessing", "preprocessing")} draggable sx={{borderRadius: 35,*/}
            {/*            backgroundColor: "#efc7e5",*/}
            {/*            // padding: "18px 36px",*/}
            {/*            // margin: "10px 0",*/}
            {/*            borderRadius: '10px',*/}
            {/*            margin: '10px',*/}
            {/*            border: "solid 0.2px darkgrey"*/}
            {/*            */}
            {/*        }}>*/}
            {/*            <ListItemIcon>*/}
            {/*                <AssessmentIcon />*/}
            {/*            </ListItemIcon>*/}

            {/*            <ListItemText primary={"Preprocessing"} />*/}
            {/*        </ListItem>*/}
            {/*    /!* ))} *!/*/}
            {/*</List>*/}
            {/* </Collapse> */}

            {/* Models */}
            <ListItem button onClick={toggleModels}>
                <ListItemIcon>
                    <Folder/>
                </ListItemIcon>
                <ListItemText primary="Models"/>
                {modelsOpen ? <ExpandLess/> : <ExpandMore/>}
            </ListItem>
            <Collapse in={modelsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {/* Classification */}
                    {/* <ListItem button onClick={toggleClassification} sx={{ pl: 4 }}>
                                <ListItemIcon>
                                    <Folder />
                                </ListItemIcon>
                                <ListItemText primary="Classification" />
                                {classificationOpen ? <ExpandLess /> : <ExpandMore />}
                            </ListItem> */}
                    {/* <Collapse in={classificationOpen} timeout="auto" unmountOnExit> */}
                    {/*    <List component="div" disablePadding sx = {{pl: 4, pr: 4}}>*/}
                    {/*        /!* {props.data.classificationModels.map((model, index) => ( *!/*/}
                    {/*            <ListItem onDragStart={(event) => onDragStart(event, "Classification", "classification")} draggable sx={{borderRadius: 35,*/}
                    {/*                pl: 2,*/}
                    {/*                backgroundColor: "#b0f2b4",*/}
                    {/*                // padding: "18px 36px",*/}
                    {/*                // margin: "10px 0",*/}
                    {/*                borderRadius: '10px',*/}
                    {/*                margin: '10px',*/}
                    {/*                border: "solid 0.2px darkgrey"*/}
                    {/*                */}
                    {/*            }}>*/}
                    {/*                <ListItemIcon sx={{}}>*/}
                    {/*                    <Description />*/}
                    {/*                </ListItemIcon>*/}
                    {/*                <ListItemText primary={"Classification"} />*/}
                    {/*            </ListItem>*/}
                    {/*        /!* ))} *!/*/}
                    {/*    </List>*/}
                    {/* </Collapse> */}

                    {/* <ListItem button onClick={toggleRegression} sx={{ pl: 4 }}>
                                <ListItemIcon>
                                    <Folder />
                                </ListItemIcon>
                                <ListItemText primary="Regression" />
                                {regressionOpen ? <ExpandLess /> : <ExpandMore />}
                            </ListItem> */}
                    {/* <Collapse in={regressionOpen} timeout="auto" unmountOnExit> */}
                    {/*    <List component="div" disablePadding sx = {{pl: 4, pr: 4}}>*/}
                    {/*        /!* {props.data.regressionModels.map((model, index) => ( *!/*/}
                    {/*            <ListItem onDragStart={(event) => onDragStart(event, "Regression", "regression")} draggable sx={{borderRadius: 35,*/}
                    {/*                pl: 2,*/}
                    {/*                backgroundColor: "lightgrey",*/}
                    {/*                // padding: "18px 36px",*/}
                    {/*                // margin: "10px 0",*/}
                    {/*                borderRadius: '10px',*/}
                    {/*                margin: '10px',*/}
                    {/*                border: "solid 0.2px darkgrey"*/}
                    {/*                */}
                    {/*            }}>*/}
                    {/*                <ListItemIcon>*/}
                    {/*                    <Description />*/}
                    {/*                </ListItemIcon>*/}
                    {/*                <ListItemText primary={"Regression"} />*/}
                    {/*            </ListItem>*/}
                    {/*        /!* ))} *!/*/}
                    {/*    </List>*/}
                    {/* </Collapse> */}

                    {/* <ListItem button onClick={toggleSentimentAnalysis} sx={{ pl: 4 }}>
                                <ListItemIcon>
                                    <Folder />
                                </ListItemIcon>
                                <ListItemText primary="Sentiment Analysis" />
                                {sentimentAnalysisOpen ? <ExpandLess /> : <ExpandMore />}
                            </ListItem> */}
                    {/* <Collapse in={sentimentAnalysisOpen} timeout="auto" unmountOnExit> */}
                    {/*    <List component="div" disablePadding sx = {{pl: 4, pr: 4}}>*/}
                    {/*        /!* {props.data.sentimentAnalysisModels.map((model, index) => ( *!/*/}
                    {/*            <ListItem onDragStart={(event) => onDragStart(event, "Sentiment", "sentiment")} draggable sx={{borderRadius: 35,*/}
                    {/*                pl: 2,*/}
                    {/*                backgroundColor: "#ffef9f",*/}
                    {/*                // padding: "18px 36px",*/}
                    {/*                // margin: "10px 0",*/}
                    {/*                borderRadius: '10px',*/}
                    {/*                margin: '10px',*/}
                    {/*                border: "solid 0.2px darkgrey"*/}
                    {/*                */}
                    {/*            }}>*/}
                    {/*                <ListItemIcon>*/}
                    {/*                    <Description />*/}
                    {/*                </ListItemIcon>*/}
                    {/*                <ListItemText primary={"Sentiment"} />*/}
                    {/*            </ListItem>*/}
                    {/*        /!* ))} *!/*/}
                    {/*    </List>*/}
                    {/* </Collapse> */}

                    <List component="div" disablePadding sx={{pl: 4, pr: 4}}>
                        <ListItem onDragStart={(event) => onDragStart(event, "ASR", "ASR")}
                                  draggable sx={{
                            pl: 2,
                            backgroundColor: "#b0f2b4",
                            borderRadius: '10px',
                            margin: '10px',
                            border: "solid 0.2px darkgrey"

                        }}>
                            <ListItemIcon sx={{}}>
                                <Description/>
                            </ListItemIcon>
                            <ListItemText primary={"ASR"}/>
                        </ListItem>
                    </List>

                    <List component="div" disablePadding sx={{pl: 4, pr: 4}}>
                        <ListItem onDragStart={(event) => onDragStart(event, "MT", "MT")} draggable
                                  sx={{
                                      pl: 2,
                                      backgroundColor: "lightgrey",
                                      borderRadius: '10px',
                                      margin: '10px',
                                      border: "solid 0.2px darkgrey"

                                  }}>
                            <ListItemIcon>
                                <Description/>
                            </ListItemIcon>
                            <ListItemText primary={"MT"}/>
                        </ListItem>
                    </List>

                    <List component="div" disablePadding sx={{pl: 4, pr: 4}}>
                        <ListItem onDragStart={(event) => onDragStart(event, "TTS", "TTS")} draggable sx={{
                            pl: 2,
                            backgroundColor: "#ffef9f",
                            borderRadius: '10px',
                            margin: '10px',
                            border: "solid 0.2px darkgrey"

                        }}>
                            <ListItemIcon>
                                <Description/>
                            </ListItemIcon>
                            <ListItemText primary={"TTS"}/>
                        </ListItem>
                    </List>

                    <List component="div" disablePadding sx={{pl: 4, pr: 4}}>
                        <ListItem onDragStart={(event) => onDragStart(event, "OCR", "OCR")} draggable sx={{
                            pl: 2,
                            backgroundColor: "orange",
                            borderRadius: '10px',
                            margin: '10px',
                            border: "solid 0.2px darkgrey"

                        }}>
                            <ListItemIcon>
                                <Description/>
                            </ListItemIcon>
                            <ListItemText primary={"OCR"}/>
                        </ListItem>
                    </List>

                </List>
            </Collapse>
        </List>
    )
}

export default InferenceNavbar;