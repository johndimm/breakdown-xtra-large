/*---------
Respondent : 88883
MainBranch : 6
Hobbyist : 2
OpenSourcer : 4
OpenSource : 4
Employment : 7
Country : 180
Student : 4
EdLevel : 10
UndergradMajor : 13
EduOther : 493
OrgSize : 10
DevType : 13142
YearsCode : 53
Age1stCode : 70
YearsCodePro : 53
CareerSat : 6
JobSat : 6
MgrIdiot : 5
MgrMoney : 4
MgrWant : 5
JobSeek : 4
LastHireDate : 7
LastInt : 64
FizzBuzz : 3
JobFactors : 176
ResumeUpdate : 7
CurrencySymbol : 144
CurrencyDesc : 144
CompTotal : 4201
CompFreq : 4
ConvertedComp : 9164
WorkWeekHrs : 208
WorkPlan : 5
WorkChallenge : 131
WorkRemote : 8
WorkLoc : 5
ImpSyn : 7
CodeRev : 5
CodeRevHrs : 94
UnitTests : 5
PurchaseHow : 6
PurchaseWhat : 5
LanguageWorkedWith : 20099
LanguageDesireNextYear : 27260
DatabaseWorkedWith : 3481
DatabaseDesireNextYear : 3924
PlatformWorkedWith : 8734
PlatformDesireNextYear : 10796
WebFrameWorkedWith : 2145
WebFrameDesireNextYear : 2313
MiscTechWorkedWith : 2785
MiscTechDesireNextYear : 5566
DevEnviron : 7719
OpSys : 7
Containers : 24
BlockchainOrg : 8
BlockchainIs : 7
BetterLife : 4
ITperson : 6
OffOn : 5
SocialMedia : 17
Extraversion : 6
ScreenName : 8
SOVisit1st : 15
SOVisitFreq : 8
SOVisitTo : 65
SOFindAnswer : 7
SOTimeSaved : 7
SOHowMuchTime : 6
SOAccount : 5
SOPartFreq : 7
SOJobs : 4
EntTeams : 4
SOComm : 8
WelcomeChange : 8
SONewContent : 17
Age : 127
Gender : 8
Trans : 3
Sexuality : 9
Ethnicity : 197
Dependents : 4
SurveyLength : 4
SurveyEase : 5

, 'MainBranch,Hobbyist,OpenSourcer,OpenSource,Employment,Country,Student,EdLevel,UndergradMajor,EduOther,OrgSize,YearsCode,Age1stCode,YearsCodePro,CareerSat,JobSat,MgrIdiot,MgrMoney,MgrWant,JobSeek,LastHireDate,LastInt,FizzBuzz,JobFactors,ResumeUpdate,CurrencySymbol,CurrencyDesc,CompFreq,WorkWeekHrs,WorkPlan,WorkChallenge,WorkRemote,WorkLoc,ImpSyn,CodeRev,CodeRevHrs,UnitTests,PurchaseHow,PurchaseWhat,OpSys,Containers,BlockchainOrg,BlockchainIs,BetterLife,ITperson,OffOn,SocialMedia,Extraversion,ScreenName,SOVisit1st,SOVisitFreq,SOVisitTo,SOFindAnswer,SOTimeSaved,SOHowMuchTime,SOAccount,SOPartFreq,SOJobs,EntTeams,SOComm,WelcomeChange,SONewContent,Age,Gender,Trans,Sexuality,Ethnicity,Dependents,SurveyLength,SurveyEase'

, 'count,Respondent'

. 'count(*) as count,sum(Respondent) as Respondent'
------------*/

drop table if exists stack_overflow_fact;
drop table if exists stack_overflow_summary;
create table stack_overflow_fact (
Respondent    int,
MainBranch    text,
Hobbyist    varchar(3),
OpenSourcer    varchar(50),
OpenSource    text,
Employment    varchar(52),
Country    varchar(41),
Student    varchar(14),
EdLevel    text,
UndergradMajor    text,
EduOther    text,
OrgSize    varchar(50),
DevType    text,
YearsCode    varchar(18),
Age1stCode    varchar(20),
YearsCodePro    varchar(18),
CareerSat    varchar(34),
JobSat    varchar(34),
MgrIdiot    varchar(22),
MgrMoney    varchar(8),
MgrWant    varchar(22),
JobSeek    varchar(62),
LastHireDate    varchar(52),
LastInt    text,
FizzBuzz    varchar(3),
JobFactors    text,
ResumeUpdate    text,
CurrencySymbol    varchar(3),
CurrencyDesc    varchar(39),
CompTotal    varchar(19),
CompFreq    varchar(7),
ConvertedComp    varchar(7),
WorkWeekHrs    varchar(8),
WorkPlan    text,
WorkChallenge    text,
WorkRemote    varchar(55),
WorkLoc    varchar(46),
ImpSyn    varchar(22),
CodeRev    varchar(39),
CodeRevHrs    varchar(5),
UnitTests    text,
PurchaseHow    text,
PurchaseWhat    text,
LanguageWorkedWith    text,
LanguageDesireNextYear    text,
DatabaseWorkedWith    text,
DatabaseDesireNextYear    text,
PlatformWorkedWith    text,
PlatformDesireNextYear    text,
WebFrameWorkedWith    text,
WebFrameDesireNextYear    text,
MiscTechWorkedWith    text,
MiscTechDesireNextYear    text,
DevEnviron    text,
OpSys    text,
Containers    text,
BlockchainOrg    varchar(55),
BlockchainIs    text,
BetterLife    varchar(13),
ITperson    varchar(40),
OffOn    varchar(8),
SocialMedia    varchar(24),
Extraversion    varchar(24),
ScreenName    varchar(11),
SOVisit1st    varchar(16),
SOVisitFreq    varchar(50),
SOVisitTo    text,
SOFindAnswer    text,
SOTimeSaved    varchar(38),
SOHowMuchTime    varchar(30),
SOAccount    varchar(25),
SOPartFreq    varchar(50),
SOJobs    text,
EntTeams    text,
SOComm    varchar(35),
WelcomeChange    varchar(55),
SONewContent    text,
Age    varchar(4),
Gender    varchar(59),
Trans    varchar(3),
Sexuality    varchar(47),
Ethnicity    text,
Dependents    varchar(28),
SurveyLength    varchar(21),
SurveyEase    varchar(26)
);


load data local infile 'stack_overflow.tsv' into table stack_overflow_fact ignore 1 lines;

create table stack_overflow_summary as select 
MainBranch,
Hobbyist,
OpenSourcer,
OpenSource,
Employment,
Country,
Student,
EdLevel,
UndergradMajor,
EduOther,
OrgSize,
YearsCode,
Age1stCode,
YearsCodePro,
CareerSat,
JobSat,
MgrIdiot,
MgrMoney,
MgrWant,
JobSeek,
LastHireDate,
LastInt,
FizzBuzz,
JobFactors,
ResumeUpdate,
CurrencySymbol,
CurrencyDesc,
CompFreq,
WorkWeekHrs,
WorkPlan,
WorkChallenge,
WorkRemote,
WorkLoc,
ImpSyn,
CodeRev,
CodeRevHrs,
UnitTests,
PurchaseHow,
PurchaseWhat,
OpSys,
Containers,
BlockchainOrg,
BlockchainIs,
BetterLife,
ITperson,
OffOn,
SocialMedia,
Extraversion,
ScreenName,
SOVisit1st,
SOVisitFreq,
SOVisitTo,
SOFindAnswer,
SOTimeSaved,
SOHowMuchTime,
SOAccount,
SOPartFreq,
SOJobs,
EntTeams,
SOComm,
WelcomeChange,
SONewContent,
Age,
Gender,
Trans,
Sexuality,
Ethnicity,
Dependents,
SurveyLength,
SurveyEase
,
count(*) as count
from stack_overflow_fact
 group by 
MainBranch,
Hobbyist,
OpenSourcer,
OpenSource,
Employment,
Country,
Student,
EdLevel,
UndergradMajor,
EduOther,
OrgSize,
YearsCode,
Age1stCode,
YearsCodePro,
CareerSat,
JobSat,
MgrIdiot,
MgrMoney,
MgrWant,
JobSeek,
LastHireDate,
LastInt,
FizzBuzz,
JobFactors,
ResumeUpdate,
CurrencySymbol,
CurrencyDesc,
CompFreq,
WorkWeekHrs,
WorkPlan,
WorkChallenge,
WorkRemote,
WorkLoc,
ImpSyn,
CodeRev,
CodeRevHrs,
UnitTests,
PurchaseHow,
PurchaseWhat,
OpSys,
Containers,
BlockchainOrg,
BlockchainIs,
BetterLife,
ITperson,
OffOn,
SocialMedia,
Extraversion,
ScreenName,
SOVisit1st,
SOVisitFreq,
SOVisitTo,
SOFindAnswer,
SOTimeSaved,
SOHowMuchTime,
SOAccount,
SOPartFreq,
SOJobs,
EntTeams,
SOComm,
WelcomeChange,
SONewContent,
Age,
Gender,
Trans,
Sexuality,
Ethnicity,
Dependents,
SurveyLength,
SurveyEase
;
