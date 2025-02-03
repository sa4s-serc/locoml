import {useRef, useState, useEffect} from "react";
import {Button, Input, Select} from "antd";
import axios from "axios";
import {DeleteOutlined} from "@ant-design/icons";

const languageOptions = [
    {label: 'English', value: 'english'},
    {label: 'Telugu', value: 'telugu'},
    {label: 'Hindi', value: 'hindi'},
    {label: 'Gujarati', value: 'gujarati'},
    {label: 'Malayalam', value: 'malayalam'}
];

const InputNode = ({id, data}) => {
    const fileInput = useRef(null);
    const [isFileUploaded, setIsFileUploaded] = useState("");
    const [inputLink, setInputLink] = useState(data?.link || "");
    const [selectedLanguage, setSelectedLanguage] = useState(data?.language || null);
    console.log(selectedLanguage)

    useEffect(() => {
        setInputLink(data?.link || "");
        setSelectedLanguage(data?.language || null);
    }, [data]);

    const handleChange = async (event) => {
        const file = event.target.files[0];

        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('filesize', file.size);
            formData.append('filename', file.name);
            formData.append('nodeid', id);
            formData.append('language', selectedLanguage);

            // Log data to check its state
            console.log('Data before upload:', data);

            // Ensure data.entity is initialized
            data.entity = formData;
            console.log('Data after assigning formData:', data.entity);

            try {
                let response = await axios.post(process.env.REACT_APP_MASTER_SERVER_GET_INPUT_FILE, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
                let uploaded_URL = response.data.status;
                setInputLink(uploaded_URL);
                console.log(uploaded_URL)
                data.onLinkChange(uploaded_URL);
                setIsFileUploaded(file.name);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleLinkChange = (event) => {
        const newLink = event.target.value;
        setInputLink(newLink);
        data.onLinkChange(newLink);
    };

    const handleLanguageChange = (value) => {
        setSelectedLanguage(value);
        data.onLanguageChange(value);
    };

    return (
        <>
            {/*<Handle*/}
            {/*    type="target"*/}
            {/*    position={Position.Top}*/}
            {/*    onConnect={(params) => console.log("handle onConnect", params)}*/}
            {/*    isConnectable={isConnectable}*/}
            {/*/>*/}
            <div className="nodeContainer" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px', padding: '10px'
            }}>
                <div className="nodeHeader"
                     style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%'}}>
                    <div className="nodeTitle" style={{marginRight: 'auto'}}>New Input</div>
                </div>
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
                <input
                    type="file"
                    accept=".mp3, .wav, .txt"
                    style={{display: 'none'}}
                    onChange={handleChange}
                    ref={fileInput}
                />
                <Button
                    style={{
                        height: "30px",
                        fontSize: "12px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: '100%',
                        backgroundColor: "#f5f5f5",
                        color: "#222222",
                        marginBottom: "10px",
                    }}
                    onClick={() => fileInput.current.click()}
                    disabled={inputLink !== ""}
                >
                    {isFileUploaded !== "" ? `Uploaded: ${isFileUploaded}` : 'Upload Dataset'}
                </Button>
                <Select
                    className="selectStyle nodrag nopan"
                    placeholder="Select Source Language"
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                    style={{marginBottom: '10px', width: '100%'}}
                    dropdownStyle={{zIndex: 1000000}}
                    options={languageOptions}
                />
            </div>
        </>
    );
};

export default InputNode;
