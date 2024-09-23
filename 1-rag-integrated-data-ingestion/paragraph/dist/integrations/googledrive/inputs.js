"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const googledrive_1 = require("@useparagon/integrations/googledrive");
const integrationInputs = (0, googledrive_1.createInputs)({
    folder_to_share: {
        id: '1b5bdbd8-5241-4e15-a953-4e34b27077cf',
        title: 'Folder to share',
        tooltip: '',
        required: false,
        type: 'folder',
    },
});
exports.default = integrationInputs;
//# sourceMappingURL=inputs.js.map