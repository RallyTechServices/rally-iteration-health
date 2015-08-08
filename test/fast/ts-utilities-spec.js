describe("Fast Utilities tests",function() {
       describe("When working with time",function(){
        it('should count the number of days as zero on the same day',function() {
            
            // 8th Month is September because Jan is 0
            var date1 = new Date(2013,08,09,0,0,0);
            var date2 = new Date(2013,08,09,23,59,0);
            
            expect( Rally.technicalservices.util.Health.daysBetween(date1,date2) ).toEqual(0);
        });
        
        it('should count the number of days as 1 on the different days',function() {
            
            var date1 = new Date(2013,08,09,23,59,0);
            var date2 = new Date(2013,08,10,0,0,0);
            
            expect( Rally.technicalservices.util.Health.daysBetween(date1,date2) ).toEqual(1);
        });
        
        it('should count the number of days between two dates',function() {
            
            var date1 = new Date(2013,08,09,0,0,0);
            var date2 = new Date(2013,08,10,0,0,0);
            
            expect( Rally.technicalservices.util.Health.daysBetween(date1,date2) ).toEqual(1);
        });
        
        it('should always return a positive number when counting the number of days between two dates',function() {
            
            var date2 = new Date(2013,08,09,0,0,0);
            var date1 = new Date(2013,08,10,0,0,0);
            
            expect( Rally.technicalservices.util.Health.daysBetween(date1,date2) ).toEqual(1);
        });
        
        it('should count weekends in date difference',function() {
            
            var date1 = new Date(2013,08,06,0,0,0);
            var date2 = new Date(2013,08,09,0,0,0);
            
            expect( Rally.technicalservices.util.Health.daysBetween(date1,date2,false) ).toEqual(3);
        });
        
        it('should not count weekends in date difference',function() {
            
            var date1 = new Date(2013,08,06,0,0,0);
            var date2 = new Date(2013,08,09,0,0,0);
            
            expect( Rally.technicalservices.util.Health.daysBetween(date1,date2,true) ).toEqual(1);
        });
        
        it('should not count weekends in date difference across two weekends',function() {
            
            var date1 = new Date(2013,08,04,0,0,0);
            var date2 = new Date(2013,08,18,0,0,0);
            
            expect( Rally.technicalservices.util.Health.daysBetween(date1,date2,true) ).toEqual(10);
        });  
        
        it('should return 0 when on a Saturday and not counting weekends in date difference',function() {
            
            var date1 = new Date(2013,08,07,0,0,0);
            var date2 = new Date(2013,08,08,0,0,0);
            
            expect( Rally.technicalservices.util.Health.daysBetween(date1,date2,true) ).toEqual(0);
        });
        
        it('should not stumble on leap day',function() {
            
            var date1 = new Date(2014,01,27,0,0,0);
            var date2 = new Date(2014,02,13,0,0,0);
            
            expect( Rally.technicalservices.util.Health.daysBetween(date1,date2,true) ).toEqual(10);
        });
                        
        it('should not care starting and ending on sunday',function() {
            
            var date1 = new Date(2014,02,09,0,0,0);
            var date2 = new Date(2014,02,23,0,0,0);
            
            expect( Rally.technicalservices.util.Health.daysBetween(date2,date1,true) ).toEqual(10);
        });
    });
});
