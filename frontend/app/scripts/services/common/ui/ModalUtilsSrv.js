(function () {
    'use strict';
    angular.module('theHiveServices').service('ModalUtilsSrv', function ($uibModal) {

        this.confirm = function (title, message, config) {
            var modal = $uibModal.open({
                templateUrl: 'views/partials/utils/confirm.modal.html',
                controller: ['$uibModalInstance', 'title', 'message', 'config', function ($uibModalInstance, title, message, config) {
                    this.title = title;
                    this.message = message;
                    this.config = config;

                    this.cancel = function () {
                        $uibModalInstance.dismiss();
                    };
                    this.confirm = function () {
                        $uibModalInstance.close();
                    };
                }],
                controllerAs: '$modal',
                resolve: {
                    title: function () {
                        return title;
                    },
                    message: function () {
                        return message;
                    },
                    config: function () {
                        return config || {};
                    }
                }
            });

            return modal.result;
        };

        this.mail = function (title, message, object, mail, config) {
            var modal = $uibModal.open({
                templateUrl: 'views/partials/utils/mail.modal.html',
                controller: ['$uibModalInstance', 'title', 'message', 'object', 'mail', 'config', function ($uibModalInstance, title, message, object, mail, config) {
                    this.title = title;
                    this.message = message;
                    this.object = object;
                    this.mail = mail;
                    this.mail.to = mail.to
                    this.mail.cc = mail.cc;
                    this.mail.subject = mail.subject;
                    this.mail.description = mail.description;
                    this.config = config;

                    this.cancel = function () {
                        $uibModalInstance.dismiss();
                    };
                    this.confirm = function () {
                        $uibModalInstance.close();
                    };
                }],
                controllerAs: '$modal',

                resolve: {
                    title: function () {
                        return title;
                    },
                    message: function () {
                        return message;
                    },
                    object: function () {
                        return object;
                    },
                    mail: function () {
                        return mail;
                    },
                    config: function () {
                        return config || {};

                    }
                }
            });
            return modal.result;
        };

        this.error = function (title, message, config) {
            var modal = $uibModal.open({
                templateUrl: 'views/partials/utils/error.modal.html',
                controller: ['$uibModalInstance', 'title', 'message', 'config', function ($uibModalInstance, title, message, config) {
                    this.title = title;
                    this.message = message;
                    this.config = config;

                    this.cancel = function () {
                        $uibModalInstance.dismiss();
                    };
                    this.confirm = function () {
                        $uibModalInstance.close();
                    };
                }],
                controllerAs: '$modal',
                resolve: {
                    title: function () {
                        return title;
                    },
                    message: function () {
                        return message;
                    },
                    config: function () {
                        return config || {};
                    }
                }
            });

            return modal.result;
        };




    });
})();
