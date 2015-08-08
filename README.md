#Rally Iteration Health

Measures health metrics for an iteration.   

This app can only be used at the leaf project level, meaning that data will not be calculated if the currently scoped project has open children.  

This app uses cumulative flow data for the selected project and iterations and can be used with any SaaS or On-Premise subscription that supports the 2.0 SDK.

Task Churn can be hidden via the App Settings.

![ScreenShot](/images/rally-iteration-health.png)
  
##Metric Definitions:  

### Scope Churn and Direction
Churn is a measure of the change in the iteration's scope.

Churn Direction (+/-) is an indicator of the general direction of scope change.  Churn is defined as a standard deviation, which is always zero or positive, so this added indicator provides an indication of whether scope tended to be added or removed

####How it is calculated
Churn is defined as the standard deviation of the total scheduled into the sprint divided by the average daily total.

Churn Direction is determined by examining every day's change from the day before and adding or subtracting the delta to determine whether scope has been added more often than subtracted. (The first day of the iteration is excluded from this calculation.

###Task Churn
Indicates when tasks have been added or removed on the last day of the iteration.  If a significant percentage of tasks are removed, it could be an indicator that the team is moving committed work items to another iteration.

####How it is calculated
The number of estimated hours for the tasks scheduled in the iteration on the last day are subtracted from the total estimated hours of tasks scheduled on the next-to-last day, then divided by the next-to-last-day totals to create a percentage.  Note that this is calculated from the <b>estimates</b> of all the tasks, not the hours remaining to-do.

### Days  
The number of full days in the iteration (Excluding weekends)

###Estimated Ratio
Represents the ratio of work items (stories and defects) that have estimates.

####How it is calculated
Divide the number of work items (stories and defects) in the iteration that have a plan estimate that is not null by the total number of items in the iteration multiplied by 100. 
Stories that have a PlanEstimate = 0 (not null) will be counted as estimated.   
        
####Coaching Tip
If there is a very high percentage or stories without estimates, other measures will not be meaningful.  This is really only useful for the beginning of an iteration, and perhaps for an iteration in early flight, but not for an iteration that has ended.  The idea is to catch this early in an iteration so other charts/graphs etc are useful for teams.  A good practice is to have a ready backlog as and entrance criteria to an iteration planning session, a ready backlog means three things, sized, ranked, and stories are elaborated sufficiently with acceptance criteria to enable conversation and confirmation during planning.

###End Acceptance Ratio
Indicates whether teams met their commitment, assuming work items have not been removed from the iteration. 

####How it is calculated
Divide the plan estimates of the work items in the iteration that were accepted on the last day of the iteration by the total plan estimate of all work items in the iteration.  If analysis type is set to 'counts', the calculation is based on the number of work items, not the plan estimate of the work items.

###In-Progress Ratio
This is an indication of how much work is in progress (WIP).  It is the ratio of the average of the work items in the in-Progress state on a daily basis. 

####How it is calculated
Divide the plan estimate of all the work items in the 'in-progress' state by the total plan estimate of the work items in the iteration, divided by the number of days.  If the iteration is in-flight, we'll divide by the number of days so far.   If analysis type is set to counts, the calculation is based on the count of the work items, not the plan estimate of the work items.
        
####Coaching Tip
A high percentage here would mean that there is a high degree of daily WIP on average.  Keeping WIP small, reduces context switching and helps team focus on the most important items to reach acceptance.
    
###End Completion Ratio
Represents the ratio of work completed by iteration end.  A low percentage might imply that there is work planned into an iteration that was left in a schedule state lower than completed.

####How it is calculated
Divide the plan estimates of the work items in the iteration that are in a schedule state that is Completed or higher at the end of the last day of the iteration by the total plan estimate of all work items in the iteration. If analysis type is set to 'counts', the calculation is based on the count of the work items, not the plan estimate of the work items.