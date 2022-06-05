{
    let folderList, documentDetails, createFolder, createSubFolder, createDocument, dragAndDropManager,
        pageOrchestrator = new PageOrchestrator();
    /**
     * This method checks if the user is logged in.
     */
    window.addEventListener('load', function () {
        if (sessionStorage.getItem("user") == null) {
            window.location.href = "login.html";
        } else {
            pageOrchestrator.start();
            pageOrchestrator.refresh();
        }
    }, false);

    function FolderList(container) {
        this.containter = container;

        this.show = function () {
            this.containter.innerHTML = "";
            var self = this;
            makeCall("GET", "GetFolders", function (response) {
                if (response.readyState === XMLHttpRequest.DONE) {
                    var text = response.responseText;
                    switch (response.status) {
                        case 200:
                            self.showContent(JSON.parse(text));
                        case 403:
                            //TODO:
                            break;
                        case 500:
                            alert(text);
                            break;
                    }
                }
            });
        };

        this.edit = function () {
            const self = this;
            let editButton = document.getElementById("EditButton");
            editButton.textContent = "UNDO";
            editButton.onclick = function () {
                self.undo();
                pageOrchestrator.hideContent();
            };
            let showDetails = document.getElementsByClassName("ShowDetails");

            for (let i = 0; i < showDetails.length; i++) {
                showDetails[i].style.visibility = "hidden";
            }

            let editButtons = document.getElementsByClassName("mngBtn");
            for (let i = 0; i < editButtons.length; i++) {
                editButtons[i].style.visibility = "visible";
            }

            dragAndDropManager.setupDragAndDrop();
        }

        this.undo = function () {
            const self = this;
            let editButton = document.getElementById("EditButton");
            editButton.textContent = "EDIT";
            editButton.onclick = function () {
                self.edit();
            };

            let showDetails = document.getElementsByClassName("ShowDetails");
            for (let i = 0; i < showDetails.length; i++) {
                showDetails[i].style.visibility = "visible";
            }

            let editButtons = document.getElementsByClassName("mngBtn");
            for (let i = 0; i < editButtons.length; i++) {
                editButtons[i].style.visibility = "hidden";
            }

            dragAndDropManager.resetDragAndDrop();
        }

        this.showContent = function (view) {
            const self = this;
            let editButton = document.createElement("button");
            editButton.id = "EditButton";
            editButton.textContent = "EDIT";
            editButton.onclick = function () {
                self.edit();
            };

            this.containter.appendChild(editButton);
            //create new folder button
            let button = document.createElement("button");
            button.className = "mngBtn";
            button.textContent = "Create Folder";
            button.addEventListener("click", function (e) {
                createFolder.enableForm();
            });
            this.containter.appendChild(button);

            view.forEach((folder) => {
                let folderElement = document.createElement("li");
                folderElement.id = "folder";
                folderElement.textContent = folder.folder.name;
                folderElement.setAttribute("folderId", folder.folder.id);

                //create new subfolder button
                let button = document.createElement("button");
                button.className = "mngBtn";
                button.textContent = "Create SubFolder";
                button.addEventListener("click", function (e) {
                    createSubFolder.enableForm(e.target.closest("li").getAttribute("folderId"));
                });
                folderElement.appendChild(button);

                if (folder.subFolderAndDocumentsList != null && folder.subFolderAndDocumentsList.length > 0) {
                    let subFolders = document.createElement("ul");
                    folder.subFolderAndDocumentsList.forEach((subFolderAndDocuments) => {
                        let subFolderElement = document.createElement("li");
                        subFolderElement.id = "subfolder";
                        subFolderElement.textContent = subFolderAndDocuments.subFolder.name;
                        subFolderElement.setAttribute("subfolderId", subFolderAndDocuments.subFolder.id);
                        subFolderElement.className = "droppable";

                        // create new document button
                        let button = document.createElement("button");
                        button.className = "mngBtn";
                        button.textContent = "Create Document";
                        subFolderElement.appendChild(button);
                        button.addEventListener("click", function (e) {
                            createDocument.enableForm(e.target.closest("li").getAttribute("subfolderId"));
                        })

                        subFolders.appendChild(subFolderElement);

                        if (subFolderAndDocuments.documentList != null && subFolderAndDocuments.documentList.length > 0) {
                            let documents = document.createElement("ul");
                            subFolderAndDocuments.documentList.forEach((doc) => {
                                let documentElement = document.createElement("li");
                                documentElement.id = "document";
                                documentElement.textContent = doc.name;
                                let showDetails = document.createElement("a");
                                showDetails.className = "ShowDetails";
                                showDetails.textContent = "    Show Details";
                                documentElement.setAttribute("documentId", doc.id);
                                documentElement.setAttribute("subfolderId", doc.subFolderId);
                                //show details on click
                                showDetails.addEventListener("click", function (e) {
                                    documentDetails.showDocument(e.target.closest("li").getAttribute("documentId"));
                                });

                                documentElement.appendChild(showDetails);
                                documents.appendChild(documentElement);
                            });
                            subFolders.appendChild(documents);
                        }
                    });
                    folderElement.appendChild(subFolders);
                }
                self.containter.appendChild(folderElement);
            });
            let trashCan = document.createElement("li");
            trashCan.textContent = "TrashCan";
            trashCan.id = "trashCan";
            this.containter.appendChild(trashCan);
            this.undo();
        }
    }

    function DragAndDropManager() {
        this.setupDragAndDrop = function () {
            let elements = document.querySelectorAll("#document");
            for(let element of elements){
                this.setMove(element);
            }
            elements = document.querySelectorAll("#subfolder");
            for(let element of elements){
                this.setDelete(element);
            }
            elements = document.querySelectorAll("#folder");
            for(let element of elements){
                this.setDelete(element);
            }
        }

        this.resetDragAndDrop = function (){
            let elements = document.getElementsByClassName("draggable");
            for(let element of elements){
                element.removeEventListener("dragover", onDragOver);
                element.removeEventListener("dragleave", onDragLeave);
                element.removeEventListener("drop", onMove);
            }
            let list = document.querySelectorAll("#subfolder");
            for(let element of list){
                element.removeEventListener("dragstart",setDeleteDrag);
            }
            list = document.querySelectorAll("#folder");
            for(let element of list){
                element.removeEventListener("dragstart",setDeleteDrag);
            }
            list = document.querySelectorAll("#document");
            for(let element of list){
                element.removeEventListener("dragstart",setDocumentDrag);
            }

            let trashCan = document.getElementById("trashCan");
            trashCan.removeEventListener("dragover", onDragOver);
            trashCan.removeEventListener("dragleave", onDragLeave);
            trashCan.removeEventListener("drop", onDelete);
        }

        this.setMove = function (element) {
            element.addEventListener("dragstart", setDocumentDrag);
        }

        this.setDelete = function (element) {
            element.addEventListener("dragstart", setDeleteDrag);
        }
        this.setTrashCan = function () {
            let trashCan = document.getElementById("trashCan");
            trashCan.addEventListener("dragover",onDragOver );

            trashCan.addEventListener("dragleave", onDragLeave);

            trashCan.addEventListener("drop", onDelete);
        }

        this.setDocumentDrop = function (startElement) {
            let elements = document.getElementsByClassName("droppable");
            let notDroppable;
            let find = false;

            for (const element of elements) {
                if (element.getAttribute("subfolderId") === startElement.getAttribute("subfolderId")) {
                    notDroppable = element;
                    find = true;
                }
            }

            for (const element of elements) {
                if (element === notDroppable) {
                    element.style.backgroundColor = "red";
                } else {
                    element.addEventListener("dragover", onDragOver);

                    element.addEventListener("dragleave", onDragLeave);

                    element.addEventListener("drop", onMove);
                }
            }
        }

        function setDocumentDrag(e, element, self){
            self.setDocumentDrop(element);
        }

        function setDeleteDrag(e, element, self){
            self.setTrashCan();
        }

        function onDragOver(e, element) {
            e.preventDefault();
            element.className = "selected";
        }

        function onDragLeave(e, element) {
            element.className = "notSelected";
        }

        function onMove(e, notDroppable ,self){
            notDroppable.style.backgroundColor = "notSelected";
            self.resetDroppable();
            let subFolderId = e.target.closest("li").getAttribute("subfolderId");
            let formData = new FormData();
            formData.append("subFolderId", subFolderId);
            formData.append("documentId", startElement.getAttribute("documentId"));
            sendFormData("POST", 'move-document', function (response) {
                if (response.readyState === XMLHttpRequest.DONE) {
                    let text = response.responseText;
                    switch (response.status) {
                        case 200:
                            pageOrchestrator.refresh();
                            break;
                        case 400:
                            alert(text);
                            break;
                        case 500:
                            alert(text);
                            break;
                        default:
                            alert("Unknown error");
                    }
                }
            }, formData);

        }

        function onDelete(e, trashCan , self) {
            trashCan.className = "notSelected";
            let element = e.target.closest("li");
            let id;
            switch (element.id) {
                case "folder":
                    id = element.getAttribute("folderId");
                    break;
                case "subFolder":
                    id = element.getAttribute("subfolderId");
                    break;
                case "document":
                    id = element.getAttribute("documentId");
                    break;
            }
            if (confirm("Are you sure you want to delete this item?")) {
                //todo call to delete;
            } else {
                self.resetDroppable();
            }
        }

        this.resetDroppable = function () {
            let elements = document.getElementsByClassName("selected");
            for (const element of elements) {
                element.className = "droppable";
            }
            elements = document.getElementsByClassName("notSelected");
            for (const element of elements) {
                element.className = "droppable";
            }

            document.getElementById("trashCan").className = "";
        }

    }


    function ShowDocument(options) {
        this.container = options['container'];
        this.documentName = options['documentName'];
        this.documentOwner = options['documentOwner'];
        this.documentDate = options['documentDate'];
        this.documentFormat = options['documentFormat'];
        this.documentSummary = options['documentSummary'];
        this.button = options['button'];

        this.hide = function () {
            this.container.style.visibility = "hidden";
        };

        this.showDocument = function (documentID) {
            let self = this;
            makeCall("GET", "document?documentId=" + documentID, function (response) {
                if (response.readyState === XMLHttpRequest.DONE) {
                    let text = response.responseText;
                    switch (response.status) {
                        case 200:
                            self.setDocumentDetails(JSON.parse(text));
                            break;
                        case 403:
                            //TODO how we handle this?
                            break;
                        case 500:
                            alert(text);
                            break;
                        default:
                            alert("Unknown error");
                    }
                }
            });

        }

        this.setDocumentDetails = function (doc) {
            pageOrchestrator.hideContent();
            this.container.style.visibility = "visible";
            this.documentName.textContent = doc.name;
            this.documentOwner.textContent = doc.owner;
            this.documentFormat.textContent = doc.format;
            this.documentSummary.textContent = doc.summary;
            this.documentDate.textContent = doc.date;

            this.button.addEventListener("click", function (e) {
                e.target.closest("div").style.visibility = "hidden";
            });
        }
    }

    function CreateFolder(container, button) {
        this.container = container;
        this.button = button;

        this.hide = function () {
            container.style.visibility = "hidden";
        }

        this.enableForm = function () {
            pageOrchestrator.hideContent();
            container.style.visibility = "visible";
            button.addEventListener("click", function (e) {
                const form = e.target.closest("form");
                if (form.checkValidity()) {
                    makeCall("POST", 'create-folder', function (response) {
                            if (response.readyState === XMLHttpRequest.DONE) {
                                const text = response.responseText;
                                switch (response.status) {
                                    case 200:
                                        pageOrchestrator.refresh();
                                        break;
                                    case 400:
                                        alert(text)
                                        break;
                                    case 500:
                                        alert(text);
                                        break;
                                    default:
                                        alert("Unknown error");
                                        break;
                                }
                            }
                        }
                        , new FormData(form));
                } else form.reportValidity();
            }, false);
        }
    }

    function CreateSubFolder(container, button) {
        this.container = container;
        this.button = button;

        this.hide = function () {
            container.style.visibility = "hidden";
        }

        this.enableForm = function (folderId) {
            pageOrchestrator.hideContent();
            container.style.visibility = "visible";
            button.addEventListener("click", function (e) {
                const form = e.target.closest("form");

                if (form.checkValidity()) {
                    const formData = new FormData(form);
                    formData.append("folderId", folderId);
                    sendFormData("POST", 'create-subfolder', function (response) {
                        if (response.readyState === XMLHttpRequest.DONE) {
                            const text = response.responseText;
                            switch (response.status) {
                                case 200:
                                    pageOrchestrator.refresh();
                                    break;
                                case 400:
                                    alert(text)
                                    break;
                                case 500:
                                    alert(text);
                                    break;
                                default:
                                    alert("Unknown error");
                                    break;
                            }
                        }
                    }, formData);
                    form.reset();
                } else form.reportValidity();
            }, false);
        }

    }

    function CreateDocument(container, button) {
        this.container = container;
        this.button = button;

        this.hide = function () {
            container.style.visibility = "hidden";
        }

        this.enableForm = function (subfolderId) {
            pageOrchestrator.hideContent();
            container.style.visibility = "visible";

            button.addEventListener("click", function (e) {
                const form = e.target.closest("form");
                if (form.checkValidity()) {
                    const formData = new FormData(form);
                    formData.append("subfolderId", subfolderId);
                    sendFormData("POST", 'create-document', function (response) {
                        if (response.readyState === XMLHttpRequest.DONE) {
                            const text = response.responseText;
                            switch (response.status) {
                                case 200:
                                    pageOrchestrator.refresh();
                                    break;
                                case 400:
                                    alert(text)
                                    break;
                                case 500:
                                    alert(text);
                                    break;
                                default:
                                    alert("Unknown error");
                                    break;
                            }
                        }
                    }, formData);
                    form.reset();
                } else form.reportValidity();
            }, false);

        }
    }

    function PageOrchestrator() {
        this.start = function () {
            folderList = new FolderList(document.getElementById("folderList"));
            documentDetails = new ShowDocument({
                container: document.getElementById("documentDetails"),
                documentName: document.getElementById("documentName"),
                documentOwner: document.getElementById("documentOwner"),
                documentDate: document.getElementById("documentDate"),
                documentFormat: document.getElementById("documentFormat"),
                documentSummary: document.getElementById("documentSummary"),
                button: document.getElementById("hideDetails")
            });
            createFolder = new CreateFolder(document.getElementById("createFolder"), document.getElementById("createFld"));
            createSubFolder = new CreateSubFolder(document.getElementById("createSubFolder"), document.getElementById("createSubFld"));
            createDocument = new CreateDocument(document.getElementById("createDocument"), document.getElementById("createDoc"));
            dragAndDropManager = new DragAndDropManager();
        }

        this.refresh = function () {
            this.hideContent();
            folderList.show();
        }

        this.hideContent = function () {
            documentDetails.hide();
            createFolder.hide();
            createSubFolder.hide();
            createDocument.hide();
        }
    }
}