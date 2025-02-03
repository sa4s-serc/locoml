import React, {memo, useState, useEffect} from "react";
import {Handle, Position} from "reactflow";
import {Select, Button, Modal} from "antd";
import "./NodeStyles.css"
import axios from "axios";
import Description from "@mui/icons-material/Description";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import {Accordion, AccordionDetails, AccordionSummary, FormControl, IconButton, Typography} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default memo(({id, data, isConnectable}) => {
    const [OCRModels, setOCRModels] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedModelId, setSelectedModelId] = useState(data?.entity?.model_id || null);
    const [destinationLanguages, setDestinationLanguages] = useState(data?.entity?.destination_languages || []);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (data?.entity?.model_id) {
            setSelectedModelId(data.entity.model_id);
            setDestinationLanguages(data.entity.destination_languages || []);
        }
    }, [data]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_GET_TRAINED_MODELS_URL}/OCR`);
                console.log("Received OCR models: ", response.data);
                const parsedModels = response.data.trained_models.map(model => JSON.parse(model.replace(/Infinity/g, "1e1000")));
                const OCRModelMap = {};
                parsedModels.forEach((model) => {
                    OCRModelMap[model.model_id] = model;
                });
                setOCRModels(OCRModelMap);
                setIsLoading(false);
            } catch (error) {
                console.log(error);
            }
        };
        fetchData();
    }, []);

    const handleModelChange = (value) => {
        setSelectedModelId(value);
        const selectedModel = OCRModels[value];
        data.entity = selectedModel;
        setDestinationLanguages(selectedModel.destination_languages || []);
    };

    const handleDestinationLanguageChange = (value) => {
        data.destinationLanguage = value;
    };

    const handleDelete = () => {
        data.onDelete(id);
    };

    return (<>
        <Handle
            type="target"
            position={Position.Top}
            onConnect={(params) => console.log("handle onConnect", params)}
            isConnectable={isConnectable}
        />
        <div className="switchNode" onClick={() => setIsModalOpen(true)}>
            {/* <div className="switchIcon" /> */}
            <Description style={{fontSize: "14px", marginLeft: "8px"}}/>
            <div className="switchLabel">OCR</div>
            <Button
                style={{height: "15px", width: "15px", borderRadius: "0px", marginLeft: "16px", marginBottom: "2px"}}
                type="text"
                icon={<DeleteSweepIcon style={{fontSize: '11px'}}/>}
                onClick={handleDelete}
                className="deleteButton"
            />
        </div>
        <Modal visible={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => setIsModalOpen(false)}
               maxWidth="sm" fullWidth>
            Edit OCR node
            <IconButton
                aria-label="close"
                onClick={() => setIsModalOpen(false)}
                sx={{position: 'absolute', right: 8, top: 8}}
            >
                <CloseIcon/>
            </IconButton>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography>Models</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FormControl fullWidth>
                        <Select
                            className="selectStyle nodrag nopan"
                            options={Object.keys(OCRModels).map((model_id) => ({
                                value: model_id, label: OCRModels[model_id].model_name
                            }))}
                            disabled={isLoading}
                            onChange={handleModelChange}
                            value={data?.entity?.model_name}
                            style={{width: '100%'}}
                        />
                        <Select
                            className="selectStyle nodrag nopan"
                            options={destinationLanguages.map((lang) => ({
                                value: lang, label: lang
                            }))}
                            onChange={handleDestinationLanguageChange}
                            disabled={!selectedModelId}
                            value={data?.destinationLanguage}
                            placeholder="Select target language"
                            style={{width: '100%', marginTop: '10px'}}
                        />
                    </FormControl>
                </AccordionDetails>
            </Accordion>
            {/*<Accordion>*/}
            {/*    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>*/}
            {/*        <Typography>node settings</Typography>*/}
            {/*    </AccordionSummary>*/}
            {/*    <AccordionDetails>*/}
            {/*        /!* add node settings content here *!/*/}
            {/*    </AccordionDetails>*/}
            {/*</Accordion>*/}
        </Modal>
        <Handle
            type="source"
            position={Position.Bottom}
            id="b"
            isConnectable={isConnectable}
        />
    </>);
});