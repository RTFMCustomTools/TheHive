(function () {
    'use strict';
    angular.module('theHiveServices').service('CortexSrv', function ($q, $http, $rootScope, $uibModal, QuerySrv, PaginatedQuerySrv, StreamSrv, AnalyzerSrv, PSearchSrv, ModalUtilsSrv) {
        var self = this;
        var baseUrl = './api/connector/cortex';

        this.listJobs = function (scope, caseId, observableId, callback) {
            return new PaginatedQuerySrv({
                name: 'observable-jobs-' + observableId,
                version: 'v1',
                scope: scope,
                streamObjectType: 'case_artifact_job',
                loadAll: false,
                sort: ['-startDate'],
                pageSize: 200,
                onUpdate: callback || angular.noop,
                operations: [
                    { '_name': 'getObservable', 'idOrName': observableId },
                    { '_name': 'jobs' }
                ],
                guard: function (updates) {
                    return _.find(updates, function (item) {
                        return (item.base.details.objectType === 'Observable') && (item.base.details.objectId === observableId);
                    }) !== undefined;
                }
            });
        }

        this.getJobs = function (caseId, observableId, analyzerId, limit) {

            return QuerySrv.query('v1', [
                {
                    '_name': 'getObservable',
                    'idOrName': observableId
                },
                {
                    '_name': 'jobs'
                },
                {
                    '_name': 'filter',
                    '_or': [
                        {
                            'analyzerId': analyzerId
                        },
                        {
                            '_like': {
                                '_field': 'analyzerDefinition',
                                '_value': analyzerId
                            }
                        }
                    ]
                },
                {
                    '_name': 'sort',
                    '_fields': [
                        {
                            'startDate': 'desc'
                        }
                    ]
                },
                {
                    '_name': 'page',
                    'from': 0,
                    'to': limit || 10
                }
            ], {
                params: {
                    name: 'observable-jobs-' + observableId
                }
            });
        };

        this.getJob = function (jobId, nstats) {
            if (nstats) {
                return $http.get(baseUrl + '/job/' + jobId, {
                    params: {
                        nstats: true
                    }
                });
            }
            return $http.get(baseUrl + '/job/' + jobId);

        };

        this.createJob = function (job) {
            return $http.post(baseUrl + '/job', job);
        };

        this.getServers = function (analyzerIds) {
            return AnalyzerSrv.serversFor(analyzerIds).then(function (servers) {
                if (servers.length === 1) {
                    return $q.resolve(servers[0]);
                } else {
                    return self.promptForInstance(servers);
                }
            });
        };

        this.promptForInstance = function (servers) {
            var modalInstance = $uibModal.open({
                templateUrl: 'views/partials/cortex/choose-instance-dialog.html',
                controller: 'ServerInstanceDialogCtrl',
                controllerAs: 'vm',
                size: '',
                resolve: {
                    servers: function () {
                        return servers;
                    }
                }
            });

            return modalInstance.result;
        };

        this.promntForResponder = function (responders) {
            if (!responders || responders.length === 0) {
                return $q.resolve('No responders available');
            }

            var modalInstance = $uibModal.open({
                animation: 'true',
                templateUrl: 'views/partials/misc/responder.selector.html',
                controller: 'ResponderSelectorCtrl',
                controllerAs: '$dialog',
                size: 'lg',
                resolve: {
                    responders: function () {
                        return responders;
                    }
                }
            });

            return modalInstance.result;
        };

        this.getResponders = function (type, id) {
            //return $http.get(baseUrl + '/responder')
            return $http.get(baseUrl + '/responder/' + type + '/' + id)
                .then(function (response) {
                    return $q.resolve(response.data);
                })
                .catch(function (err) {
                    return $q.reject(err);
                });
        };

        this.runResponder = function (responderId, responderName, type, object) {
            var responderSubName = responderName;
            if (responderSubName.toLowerCase().includes("owa") && type.toLowerCase() == "case_task") {
                if (object.task.status.toLowerCase() == "inprogress") {
                    var caseParent = object.$parent.caze;
                    var task = object.task;
                    var task_attachments = object.logs.values;

                    var mail = new Object();
                    mail['to'] = " ";
                    mail['cc'] = " ";
                    mail['subject'] = caseParent.title;

                    if (!task.description || 0 === task.description.length) {
                        return ModalUtilsSrv.error('[ERROR] Cannot run responder ' + responderName, 'The responder cannot be executed without description', {
                            okText: 'Yes'
                        }).then(function () {
                            return;
                        });
                    }

                    mail['description'] = task.description;
                    mail['caseDescription'] = caseParent.description;
                    mail['caseMailFROM'] = " ";
                    mail['caseMailTO'] = " ";
                    mail['caseMailCC'] = " ";

                    for (var i = 0; i < caseParent.customFields.length; i++) {

                        if (caseParent.customFields[i].description.toLowerCase().includes("mailfrom")) {
                            mail['caseMailFROM'] = caseParent.customFields[i].value.replace(/ /g, '');
                            if (mail['caseMailFROM'][mail['caseMailFROM'].length - 1] != ";") {
                                mail['caseMailFROM'] = mail['caseMailFROM'] + ";";
                            }
                        }
                        if (caseParent.customFields[i].description.toLowerCase().includes("mailto")) {
                            mail['caseMailTO'] = caseParent.customFields[i].value.replace(/ /g, '');
                            if (mail['caseMailTO'][mail['caseMailTO'].length - 1] != ";") {
                                mail['caseMailTO'] = mail['caseMailTO'] + ";";
                            }
                        }
                        if (caseParent.customFields[i].description.toLowerCase().includes("mailcc")) {
                            mail['caseMailCC'] = caseParent.customFields[i].value.replace(/ /g, '');
                            if (mail['caseMailCC'][mail['caseMailCC'].length - 1] != ";") {
                                mail['caseMailCC'] = mail['caseMailCC'] + ";";
                            }
                        }
                    }

                    if (task.group.toLowerCase().includes("reply")) {
                        if (mail['caseMailFROM']) {
                            mail['to'] = mail['caseMailFROM'].trim();
                        }
                    }
                    if (task.group.toLowerCase().includes("replyall") || task.group.toLowerCase().includes("reply all")) {
                        if (mail['caseMailFROM']) {
                            mail['to'] = mail['caseMailFROM'].trim();
                        }
                        if (mail['caseMailCC']) {
                            if (mail['to'].trim().endsWith(";")) {
                                mail['to'] = mail['to'] + "" + mail['caseMailCC'].trim();
                            }
                            else {
                                mail['to'] = mail['to'] + ";" + mail['caseMailCC'].trim();
                            }
                        }
                    }

                    //Recuperare Name, ID, ROW dai TASK LOG
                    var attachments = [];
                    for (var i = 0; i < task_attachments.length; i++) {
                        var attachment = {};
                        attachment['name'] = task_attachments[i].attachment.name;
                        attachment['id'] = task_attachments[i].attachment.id
                        attachments[i] = attachment;
                    }
                    mail['attachments'] = attachments;

                    var desc = task.description;
                    if (desc.includes("[ #Parent Mail#")) {
                        var splitDesc = desc.split("[ #Parent Mail#");
                        task.description = splitDesc[0].substring(0, splitDesc[0].length - 2);

                        mail['description'] = task.description;
                    }

                    var descListMail = []
                    if (task.description.includes("[ ")) {
                        var splitDesc = task.description.split("[ ");
                        for (var i = 0; i < splitDesc.length; i++) {
                            var item = {};
                            if (splitDesc[i].trim().length > 0 && splitDesc[i].toLowerCase().trim().substring(0, 4) == "info") {
                                item['desc'] = "[ " + splitDesc[i].trim();
                                descListMail[i] = item;
                            }
                            else {
                                item['desc'] = splitDesc[i].trim();
                                descListMail[i] = item;
                            }
                        }
                    }
                    else {
                        var item = {};
                        item['desc'] = task.description.trim();
                        descListMail[0] = item;
                    }

                    mail['listMail'] = descListMail;

                    return ModalUtilsSrv.mail('Run responder ' + responderName, 'Are you sure you want to run responder ' + responderName + '?', task, mail, {
                        okText: 'Yes, run it'
                    }).then(function () {

                        var post = {
                            responderId: responderId,
                            objectType: type,
                            objectId: task._id,
                            parameters: mail
                        };

                        if (!mail['to'] || 0 === mail['to'].trim().length) {
                            if (!mail['cc'] || 0 === mail['cc'].trim().length) {
                                return ModalUtilsSrv.error('[ERROR] Cannot run responder ' + responderName, 'The responder cannot be executed without receiver', {
                                    okText: 'Yes'
                                }).then(function () {
                                    return;
                                });
                            }
                        }

                        var mailDate = new Date().toLocaleString();
                        var newDescrition = "[ Info mail - Date: " + mailDate + " To:" + mail['to'] + " CC:" + mail['cc'] + " ] \n\n" + task.description + "\n\n" + "[ #Parent Mail# From:" + mail['caseMailFROM'] + " To:" + mail['caseMailTO'] + " CC:" + mail['caseMailCC'] + " ]\n\n" + caseParent.description;
                        task.description = newDescrition;
                        return $http.post(baseUrl + '/action', post);
                    });
                } else {
                    return ModalUtilsSrv.error('[ERROR] Cannot run responder ' + responderName, 'The responder cannot be executed if the task is not started', {
                        okText: 'Yes'
                    }).then(function () {
                        return;
                    });
                }
            }
            else {
                if (responderSubName.toLowerCase().includes("owa") && type.toLowerCase() == "bad_case_task") {
                    return ModalUtilsSrv.error('[ERROR] Cannot run responder ' + responderName, 'The responder cannot be executed from this section', {
                        okText: 'Yes'
                    }).then(function () {
                        return;
                    });
                }
                else {
                    if (type.toLowerCase() == "bad_case_task" || type.toLowerCase() == "case_task") {
                        var post = {
                            responderId: responderId,
                            objectType: type,
                            objectId: object.task._id
                        };

                        return ModalUtilsSrv.confirm('Run responder ' + responderName, 'Are you sure you want to run responser ' + responderName + '?', {
                            okText: 'Yes, run it'
                        }).then(function () {
                            return $http.post(baseUrl + '/action', post);
                        });

                    }
                    else {
                        var post = {
                            responderId: responderId,
                            objectType: type,
                            objectId: object._id
                        };

                        return ModalUtilsSrv.confirm('Run responder ' + responderName, 'Are you sure you want to run responser ' + responderName + '?', {
                            okText: 'Yes, run it'
                        }).then(function () {
                            return $http.post(baseUrl + '/action', post);
                        });
                    }
                }
            }

        };


    });

})();
