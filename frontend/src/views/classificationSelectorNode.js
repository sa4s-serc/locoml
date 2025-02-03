import React, {memo} from "react";
import {Handle, Position} from "reactflow";
import {Select, Space, Button} from "antd";
import {DeleteOutlined} from '@ant-design/icons';
import axios from "axios";


export default memo(({id, data, isConnectable, nodeType}) => {

    const [classificationModels, setClassificationModels] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
            const fetchData = async () => {
                axios.get(process.env.REACT_APP_GET_TRAINED_MODELS_URL + "/classification")
                    .then((response) => {
                        console.log("Received classification models: ", response.data);
                        var classificationModelMap = {};
                        const parsedModels = response.data.trained_models.map(model => JSON.parse(model.replace(/Infinity/g, "1e1000")));
                        parsedModels.forEach((model) => {
                            classificationModelMap[model.model_id] = model;
                        });
                        setClassificationModels(classificationModelMap);
                        setIsLoading(false);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
            fetchData();
        }
        , []);

    const handleChange = (value) => {
        // Pass selected value to parent component
        data.entity = classificationModels[value];
    };

    const handleDelete = () => {
        data.onDelete(id);
    }

    return (
        <>
            <Handle
                type="target"
                position={Position.Top}
                // style={{ background: "#555" }}
                onConnect={(params) => console.log("handle onConnect", params)}
                isConnectable={isConnectable}
            />
            <div className="nodeContainer">
                <div className="nodeHeader">
                    <div className="nodeTitle">Classification</div>
                    <Button
                        type="text"
                        icon={<DeleteOutlined style={{fontSize: '12px'}}/>}
                        onClick={handleDelete}
                        className="deleteButton"
                    />
                </div>
                <Select
                    className="selectStyle nodrag nopan"
                    options={Object.keys(classificationModels).map((model_id) => ({
                        value: model_id,
                        label: classificationModels[model_id].model_name
                    }))}
                    // className="nodrag nopan"
                    disabled={isLoading}
                    onChange={handleChange}
                />
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="b"
                // style={{ bottom: 10, top: "auto", background: "#555" }}
                isConnectable={isConnectable}
            />
        </>
    );
});
