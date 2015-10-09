define('PaymentWizard.Router', ['Wizard.Router', 'PaymentWizard.View', 'PaymentWizard.Step'], function (WizardRouter, PaymentWizardView, PaymentWizardStep)
{
	'use strict';
	
	return WizardRouter.extend({

		view: PaymentWizardView

	,	step: PaymentWizardStep

	,	runStep: function()
		{
			if (SC.ENVIRONMENT.permissions.transactions.tranCustPymt < 2)
			{
				this.application.getLayout().forbiddenError();
			}
			else
			{
				WizardRouter.prototype.runStep.apply(this, arguments);
			}
		}

	,	hidePayment: function ()
		{
			return (!this.model.get('payment') && !this.model.get('confirmation')) || (this.model.get('confirmation') && !this.model.get('confirmation').payment);
		}
	});
});
