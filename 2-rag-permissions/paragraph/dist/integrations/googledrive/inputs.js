"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const googledrive_1 = require("@useparagon/integrations/googledrive");
const integrationInputs = (0, googledrive_1.createInputs)({
    folder_to_share: {
        id: 'Google-drive-input',
        title: 'folder-to-share',
        required: false,
        type: 'folder',
    }
});
exports.default = integrationInputs;
//# sourceMappingURL=inputs.js.map