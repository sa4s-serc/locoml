// OUTDATED, DOES NOT SUPPORT STATE SAVING AND RESTORING. BEST TO RECREATE THIS NODE COMPONENT FROM SCRATCH.

// import React, { memo } from "react";
// import { Handle, Position } from "reactflow";
// import { Select, Space, Button } from "antd";
// import { DeleteOutlined } from '@ant-design/icons';
//
// export default memo(({ id, data, isConnectable, nodeType }) => {
//
//   const preprocessing = ['Drop Duplicate Rows', 'Interpolate Missing Values', 'Normalize Features'];
//
//   const handleChange = (value) => {
//     data.entity = value;
//   }
//
//   const handleDelete = () => {
//     data.onDelete(id);
//   }
//
//   return (
//     <>
//       <Handle
//         type="target"
//         position={Position.Top}
//         // style={{ background: "#555" }}
//         onConnect={(params) => console.log("handle onConnect", params)}
//         isConnectable={isConnectable}
//       />
//       <div className="nodeContainer">
//         <div className="nodeHeader">
//           <div className="nodeTitle">Preprocessing</div>
//           <Button
//             type="text"
//             icon={<DeleteOutlined style={{ fontSize: '12px' }} />}
//             onClick={handleDelete}
//             className="deleteButton"
//           />
//         </div>
//           <Select
//             className="selectStyle nodrag nopan"
//             options={preprocessing.map((preprocess) => ({
//               value: preprocess,
//               label: preprocess
//             }))}
//             onChange={handleChange}
//             // className="nodrag nopan"
//           />
//       </div>
//       <Handle
//         type="source"
//         position={Position.Bottom}
//         id="b"
//         // style={{ bottom: 10, top: "auto", background: "#555" }}
//         isConnectable={isConnectable}
//       />
//     </>
//   );
// });
