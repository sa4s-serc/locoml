import React from "react"; 
import axios from "axios"; 
import {CircularProgress, Typograpgy} from "@mui/material"; 
import {Row, Col} from "reactstrap"; 
import { Typography } from "antd";
import './InferenceZoo_CardView.css'; 


function InferenceZoo_CardView() {
    const [loading, setLoading] = React.useState(true);
    const cardData = Array(9).fill(null).map((_, index) => ({
        title: `Model ${index + 1}`,
        description: `Description of model ${index + 1}...`,
        language: "English",
        category: "ASR"
    }));

    return (
        <div className="content">
        <div className="card-container">
            {cardData.map((card, index) => (
                <div className="card" key={index}>
                    <div className="card-header">
                        <Typography variant="h6">
                            {card.title}
                        </Typography>
                    </div>
                    <div className="card-body">
                        <Typography variant="body2">
                            {card.description}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Language:</strong> {card.language}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Category:</strong> {card.category}
                        </Typography>
                    </div>
                    <div className="card-footer">
                        <a href="#" className="details-button">
                            View Details
                        </a>
                    </div>
                </div>
            ))}
        </div>
        </div>
    ); 
}

export default InferenceZoo_CardView; 