export var input = "[\n" +
    "\t{\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"string\",\n" +
    "\t\t\t\t\"name\": \"name_\",\n" +
    "\t\t\t\t\"type\": \"string\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"string\",\n" +
    "\t\t\t\t\"name\": \"symbol_\",\n" +
    "\t\t\t\t\"type\": \"string\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint8\",\n" +
    "\t\t\t\t\"name\": \"decimals_\",\n" +
    "\t\t\t\t\"type\": \"uint8\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"balance_ext_\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"mint_id_\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"nonpayable\",\n" +
    "\t\t\"type\": \"constructor\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"anonymous\": false,\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"indexed\": true,\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"owner\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"indexed\": true,\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"spender\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"indexed\": false,\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"value\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"Approval\",\n" +
    "\t\t\"type\": \"event\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"anonymous\": false,\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"indexed\": true,\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"from\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"indexed\": true,\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"to\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"indexed\": false,\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"value\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"Transfer\",\n" +
    "\t\t\"type\": \"event\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"owner\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"spender\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"allowance\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"view\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"spender\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"amount\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"approve\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"bool\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"bool\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"nonpayable\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"account\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"balanceOf\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"view\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [],\n" +
    "\t\t\"name\": \"balance_ext\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"view\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [],\n" +
    "\t\t\"name\": \"decimals\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint8\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"uint8\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"view\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"spender\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"subtractedValue\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"decreaseAllowance\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"bool\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"bool\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"nonpayable\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"from\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"to\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"signer\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"amount\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"deposit\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"bool\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"bool\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"nonpayable\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"spender\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"addedValue\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"increaseAllowance\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"bool\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"bool\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"nonpayable\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [],\n" +
    "\t\t\"name\": \"mint_id\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"view\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [],\n" +
    "\t\t\"name\": \"name\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"string\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"string\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"view\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [],\n" +
    "\t\t\"name\": \"symbol\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"string\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"string\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"view\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [],\n" +
    "\t\t\"name\": \"totalSupply\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"view\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"recipient\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"amount\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"transfer\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"bool\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"bool\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"nonpayable\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"sender\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"address\",\n" +
    "\t\t\t\t\"name\": \"recipient\",\n" +
    "\t\t\t\t\"type\": \"address\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"amount\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"transferFrom\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"bool\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"bool\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"nonpayable\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t},\n" +
    "\t{\n" +
    "\t\t\"inputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"to\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t},\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"uint256\",\n" +
    "\t\t\t\t\"name\": \"amount\",\n" +
    "\t\t\t\t\"type\": \"uint256\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"name\": \"withdraw\",\n" +
    "\t\t\"outputs\": [\n" +
    "\t\t\t{\n" +
    "\t\t\t\t\"internalType\": \"bool\",\n" +
    "\t\t\t\t\"name\": \"\",\n" +
    "\t\t\t\t\"type\": \"bool\"\n" +
    "\t\t\t}\n" +
    "\t\t],\n" +
    "\t\t\"stateMutability\": \"nonpayable\",\n" +
    "\t\t\"type\": \"function\"\n" +
    "\t}\n" +
    "]"