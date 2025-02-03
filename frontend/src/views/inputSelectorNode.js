import {memo, useRef, useState, useEffect} from "react";
import {Handle, Position} from "reactflow";
import {Button, Input, Select, Modal, Upload} from "antd";
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import axios from "axios";
import {UploadOutlined} from '@ant-design/icons';
import './NodeStyles.css';
import DatasetLinkedOutlinedIcon from "@mui/icons-material/DatasetLinkedOutlined";

const InputNode = ({id, data, isConnectable}) => {
    const [isFileUploaded, setIsFileUploaded] = useState("");
    const [nodeName, setNodeName] = useState(data?.name || "");
    const [inputLink, setInputLink] = useState(data?.link || "");
    const [languageOptions, setLanguageOptions] = useState(data?.entity?.languageOptions || [])
    const [selectedLanguage, setSelectedLanguage] = useState(data?.language || null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setNodeName(data?.name || "");
        setInputLink(data?.link || "");
        setSelectedLanguage(data?.language || null);
    }, [data]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_GET_INPUT_LANGUAGES}`);
                console.log("Received Input Languages: ", response.data);
                const parsedLanguages = response.data.input_languages.map(language => JSON.parse(language.replace(/Infinity/g, "1e1000")));
                setLanguageOptions(parsedLanguages);
                setIsLoading(false);
            } catch (error) {
                console.log(error);
            }
        };
        fetchData();
    }, []);

    const handleChange = async (info) => {
        const file = info.file;

        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('filesize', file.size);
            formData.append('filename', file.name);
            formData.append('nodeid', id);
            formData.append('language', selectedLanguage);

            data.entity = formData;
            console.log(data.entity);

            try {
                let response = await axios.post(process.env.REACT_APP_MASTER_SERVER_GET_INPUT_FILE, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
                let uploaded_URL = response.data.status;
                setInputLink(uploaded_URL);
                data.onLinkChange(id, uploaded_URL);
                setIsFileUploaded(file.name);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleDelete = () => {
        data.onDelete(id);
    };

    const handleNameChange = (event) => {
        const newName = event.target.value;
        setNodeName(newName);
        data.onNameChange(id, newName);
    };

    const handleLinkChange = (event) => {
        const newLink = event.target.value;
        setInputLink(newLink);
        data.onLinkChange(id, newLink);
    };

    const handleLanguageChange = (value) => {
        setSelectedLanguage(value);
        data.onLanguageChange(id, value);
    };

    return (<>
        <div className="switchNode" onClick={() => setIsModalOpen(true)}>
            {/* <div className="switchIcon" /> */}
            <DatasetLinkedOutlinedIcon style={{fontSize: "14px", marginLeft: "8px"}}/>
            <div className="switchLabel">Input</div>
            <Button
                style={{
                    height: "15px", width: "15px", borderRadius: "0px", marginLeft: "16px", marginBottom: "2px"
                }}
                type="text"
                icon={<DeleteSweepIcon style={{fontSize: '11px'}}/>}
                onClick={handleDelete}
                className="deleteButton"
            />
        </div>
        <Modal
            title="Upload Dataset"
            visible={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
        >
            <Upload
                type="file"
                beforeUpload={() => false}
                accept=".mp3, .wav, .txt, .png, .jpg, .jpeg"
                onChange={handleChange}
            >
                <Button icon={<UploadOutlined/>}
                        disabled={inputLink !== ""}> {isFileUploaded !== "" ? `Uploaded: ${isFileUploaded}` : 'Upload Dataset'}</Button>
            </Upload>
            {isFileUploaded && <p>Uploaded: {isFileUploaded}</p>}
            <Input
                placeholder="Name this input node"
                value={nodeName}
                onChange={handleNameChange}
                style={{
                    marginBottom: '10px', width: '100%', height: '25px', fontSize: '12px',
                }}
            />
            <Input
                placeholder="Input URL"
                value={inputLink}
                onChange={handleLinkChange}
                disabled={isFileUploaded !== ""}
                style={{
                    marginBottom: '10px', width: '100%', height: '25px', fontSize: '12px',
                }}
            />
            <div style={{textAlign: 'center', margin: '10px 0', fontWeight: 'bold'}}>OR</div>
            <Select
                className="selectStyle nodrag nopan"
                placeholder="Select Source Language"
                value={selectedLanguage}
                onChange={handleLanguageChange}
                disabled={isLoading}
                style={{marginBottom: '10px', width: '100%'}}
                options={languageOptions}
            />
        </Modal>
        <Handle
            type="source"
            position={Position.Bottom}
            id="b"
            isConnectable={isConnectable}
        />
    </>);
};

export default memo(InputNode);
