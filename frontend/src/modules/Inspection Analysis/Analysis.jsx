import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  ClipboardCheck, AlertTriangle, ShieldAlert, TrendingUp,
  Filter, Download, RefreshCw, Eye, Settings, AlertCircle, CalendarClock, 
  ChevronUp, ChevronDown, BarChart3, PieChartIcon, TrendingDown, Bell,
  AlertOctagon, CalendarDays, Clock, X, AlertCircle as AlertCircleIcon,
  Search, Activity, Target, TrendingUp as TrendingUpIcon, Users, CheckCircle, Wrench
} from 'lucide-react';

function Analysis() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Current user from localStorage
  const [currentUser, setCurrentUser] = useState(null);
  
  // Filter states - Set ALL as default (no date range)
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState(''); // Empty by default
  
  // State for data
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalInspections: 0,
    overdueInspections: 0,
    highRiskEquipment: 0,
    avgSeverity: 0,
    inspectionTrend: 0,
    complianceRate: 0
  });

  const [findingsTrendData, setFindingsTrendData] = useState([]);
  const [defectTypeData, setDefectTypeData] = useState([]);
  const [highRiskEquipmentData, setHighRiskEquipmentData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [performanceBenchmarks, setPerformanceBenchmarks] = useState({
    equipmentReliability: [],
    maintenanceEffectiveness: [],
    overallScore: 0
  });
  const [complianceData, setComplianceData] = useState([]);
  const [recurringDefectsData, setRecurringDefectsData] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [observations, setObservations] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  // Get user from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Initialize dates - REMOVED automatic date range setting
  // Dates are empty by default to show "All" data
  useEffect(() => {
    // No default date range - show all data
    // Keep date fields empty
    setStartDate('');
    setEndDate('');
    setDateRange('');
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, yearFilter, monthFilter, equipmentTypeFilter, startDate, endDate]);

  // Helper functions
  const handleClearFilters = useCallback(() => {
    setYearFilter('all');
    setMonthFilter('all');
    setEquipmentTypeFilter('all');
    setDateRange('');
    
    // Reset to no date range (show all data)
    setStartDate('');
    setEndDate('');
  }, []);

  const getMonthName = useCallback((monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[parseInt(monthNumber) - 1] || monthNumber;
  }, []);

  const hasActiveFilters = useCallback(() => {
    return yearFilter !== 'all' || 
           monthFilter !== 'all' || 
           startDate || 
           endDate || 
           equipmentTypeFilter !== 'all';
  }, [yearFilter, monthFilter, startDate, endDate, equipmentTypeFilter]);

  const fetchUpcomingSchedules = useCallback(async () => {
  if (!currentUser) return;
  
  try {
    console.log('🔄 Fetching inspection schedules...');
    
    // Get inspector ID from current user
    const inspectorId = currentUser.id || currentUser.user_id;
    
    // Fetch schedules - include 'Confirmed' status for upcoming
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('inspectionschedule')
      .select(`
        schedule_id,
        equipment_id,
        engineer_id,
        inspector_id,
        scheduled_date,
        start_time,
        end_time,
        details,
        status,
        priority,
        created_at,
        updated_at
      `)
      .eq('inspector_id', inspectorId)
      .in('status', ['Confirmed', 'Scheduled', 'In Progress', 'Pending', 'Completed'])
      .order('scheduled_date', { ascending: true })
      .limit(20);
    
    if (scheduleError) {
      console.error('❌ Error fetching from inspectionschedule:', scheduleError);
      throw scheduleError;
    }
    
    // Fetch equipment details
    const equipmentIds = [...new Set(scheduleData?.map(s => s.equipment_id) || [])];
    let equipmentData = [];
    
    if (equipmentIds.length > 0) {
      const { data: eqData, error: eqError } = await supabase
        .from('equipment')
        .select(`
          id,
          equipment_tag_no,
          equipment_description,
          location
        `)
        .in('id', equipmentIds);
      
      if (eqError) console.warn('Could not fetch equipment details:', eqError);
      equipmentData = eqData || [];
    }
    
    // Fetch engineer details for schedules with engineer_id
    
    const engineerIds = [...new Set(scheduleData?.map(s => s.engineer_id).filter(id => id) || [])];
    let engineerData = [];
    
    if (engineerIds.length > 0) {
      const { data: engData, error: engError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          name,  // ADD THIS LINE - some tables might have 'name' field instead
          role
        `)
        .in('id', engineerIds);
      
      if (engError) console.warn('Could not fetch engineer details:', engError);
      engineerData = engData || [];
    }
    
    // Combine schedule data with equipment and engineer details
    const combinedData = scheduleData?.map(schedule => {
      const equipment = equipmentData.find(eq => eq.id === schedule.equipment_id);
      const engineer = engineerData.find(eng => eng.id === schedule.engineer_id);
      const scheduleDate = new Date(schedule.scheduled_date);
      const today = new Date();
      const daysUntil = Math.floor((scheduleDate - today) / (1000 * 60 * 60 * 24));
      
      // Format time
      const formatTime = (timeString) => {
        if (!timeString) return '';
        const time = new Date(`2000-01-01T${timeString}`);
        return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      };
      
      // Get engineer name - try multiple possible fields
      let engineerName = 'Not assigned';
      if (engineer) {
        if (engineer.name && engineer.name.trim() !== '') {
          engineerName = engineer.name;
        } else if (engineer.first_name || engineer.last_name) {
          engineerName = `${engineer.first_name || ''} ${engineer.last_name || ''}`.trim();
        } else if (engineer.email) {
          engineerName = engineer.email.split('@')[0]; // Use email username as fallback
        }
      }
      
      return {
        scheduleId: schedule.schedule_id,
        equipmentId: schedule.equipment_id,
        equipmentTag: equipment?.equipment_tag_no || `ID: ${schedule.equipment_id}`,
        equipmentDescription: equipment?.equipment_description || 'Equipment not found',
        location: equipment?.location || 'Unknown',
        scheduledDate: schedule.scheduled_date,
        startTime: formatTime(schedule.start_time),
        endTime: formatTime(schedule.end_time),
        status: schedule.status || 'Pending',
        priority: schedule.priority || 'Medium',
        engineerId: schedule.engineer_id,
        engineerName: engineerName, // Use the calculated engineer name
        engineerEmail: engineer?.email || '',
        daysUntil: daysUntil >= 0 ? daysUntil : 0,
        createdAt: schedule.created_at,
        updatedAt: schedule.updated_at
      };
    }) || [];
    
    setUpcomingSchedules(combinedData);
    console.log(`✅ Loaded ${combinedData.length} inspection schedules`);
    
  } catch (err) {
    console.error('❌ Error fetching inspection schedules:', err);
    setError('Failed to load inspection schedules.');
  }
}, [currentUser]);
  const fetchData = useCallback(async () => {
  if (!currentUser) return;
  
  setLoading(true);
  setError(null);
  
  try {
    console.log('🔄 Fetching analysis data from Supabase...');
    
    // Get inspector ID from current user
    const inspectorId = currentUser.id || currentUser.user_id;
    
    // 1. Build inspection query with filters - ADDED INSPECTOR FILTERING
    let query = supabase
      .from('Inspection')
      .select(`
        inspection_id,
        equipment_tag_no,
        inspection_date,
        status,
        priority,
        scheduled_date,
        due_date,
        next_inspection_date,
        defect_type,
        remarks,
        user_id,
        inspection_type,
        remarks_general,
        findings_summary,
        plant_unit_area,
        report_no,
        created_at,
        updated_at
      `)
      .eq('user_id', inspectorId);  // ADDED: Filter by current inspector
    
    // Apply date filters only if dates are selected
    if (startDate) {
      query = query.gte('inspection_date', startDate);
    }
    if (endDate) {
      query = query.lte('inspection_date', endDate);
    }
    
    // Apply year filter
    if (yearFilter !== 'all') {
      const startYear = `${yearFilter}-01-01`;
      const endYear = `${yearFilter}-12-31`;
      query = query.gte('inspection_date', startYear)
                   .lte('inspection_date', endYear);
    }
    
    // Apply month filter (if year is also selected)
    if (monthFilter !== 'all' && yearFilter !== 'all') {
      const month = monthFilter.padStart(2, '0');
      const startMonth = `${yearFilter}-${month}-01`;
      const endMonth = `${yearFilter}-${month}-31`;
      query = query.gte('inspection_date', startMonth)
                   .lte('inspection_date', endMonth);
    }
    
    query = query.order('inspection_date', { ascending: false });
    
    const { data: inspectionData, error: inspectionError } = await query;
    
    if (inspectionError) throw inspectionError;
    
    // 2. Fetch observations for these inspections
    const inspectionIds = inspectionData?.map(i => i.inspection_id) || [];
    let observationData = [];
    
    if (inspectionIds.length > 0) {
      const { data: obsData, error: obsError } = await supabase
        .from('Observation')
        .select(`
          observation_id,
          inspection_id,
          component,
          location,
          observation_type,
          severity,
          status,
          priority,
          action_required,
          created_at
        `)
        .in('inspection_id', inspectionIds);
      
      if (obsError) console.warn('Could not fetch observations:', obsError);
      observationData = obsData || [];
    }
    
    // 3. Fetch findings for these observations
    const observationIds = observationData?.map(o => o.observation_id) || [];
    let findingData = [];
    
    if (observationIds.length > 0) {
      const { data: findData, error: findError } = await supabase
        .from('Finding')
        .select(`
          finding_id,
          observation_id,
          finding_key,
          finding_text,
          created_at
        `)
        .in('observation_id', observationIds);
      
      if (findError) console.warn('Could not fetch findings:', findError);
      findingData = findData || [];
    }
    
    // 4. Fetch equipment data
    const { data: equipmentData, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        id,
        equipment_tag_no,
        equipment_description,
        type_id,
        location,
        inspection_due_date,
        status,
        nominal_thickness,
        corrosion_allowance,
        design_pressure,
        design_temperature,
        created_at
      `)
      .order('equipment_tag_no');
    
    if (equipmentError) throw equipmentError;
    
    // 5. Apply equipment type filter to the data
    let filteredInspections = inspectionData || [];
    let filteredEquipment = equipmentData || [];
    
    if (equipmentTypeFilter !== 'all') {
      filteredEquipment = equipmentData.filter(eq => 
        eq.equipment_description === equipmentTypeFilter
      );
      
      const equipmentTags = filteredEquipment.map(eq => eq.equipment_tag_no);
      filteredInspections = inspectionData.filter(insp => 
        equipmentTags.includes(insp.equipment_tag_no)
      );
    }
    
    // 6. Fetch unique equipment types from equipment_description
    const uniqueEquipmentTypes = [];
    const seenDescriptions = new Set();
    
    equipmentData?.forEach(eq => {
      if (eq.equipment_description && !seenDescriptions.has(eq.equipment_description)) {
        seenDescriptions.add(eq.equipment_description);
        uniqueEquipmentTypes.push({
          id: eq.equipment_description,
          name: eq.equipment_description
        });
      }
    });
    
    // Sort alphabetically
    uniqueEquipmentTypes.sort((a, b) => a.name.localeCompare(b.name));
    
    setEquipmentTypes(uniqueEquipmentTypes);
    
    setInspections(filteredInspections);
    setObservations(observationData || []);
    setEquipmentList(filteredEquipment);
    
    // Calculate all derived data
    await calculateAllData(filteredInspections, observationData || [], filteredEquipment);
    
    // Also fetch upcoming schedules
    await fetchUpcomingSchedules();
    
    console.log('✅ Analysis data loaded successfully');
    console.log(`📊 Loaded ${filteredInspections.length} inspections for inspector ${inspectorId}`);
    
  } catch (err) {
    console.error('❌ Error fetching analysis data:', err);
    setError(err.message || 'Failed to load analysis data. Please try again.');
  } finally {
    setLoading(false);
  }
}, [currentUser, startDate, endDate, yearFilter, monthFilter, equipmentTypeFilter, fetchUpcomingSchedules]);

  const calculateAllData = async (inspections, observations, equipment) => {
    calculateSummaryMetrics(inspections, observations);
    calculateHighRiskEquipment(inspections, observations, equipment);
    calculateOverdueUpcoming(inspections, equipment);
    calculateFindingsTrend(inspections, equipment, observations);
    calculateDefectTypeDistribution(inspections);
    calculateRecurringDefects(inspections); // Changed to use inspections instead of observations
    calculatePerformanceBenchmarks(inspections, observations, equipment);
    calculateComplianceData(inspections, equipment);
  };

  const calculateSummaryMetrics = (inspections, observations) => {
    const totalInspections = inspections.length;
    
    // Count inspections from Inspection table where due_date is past AND status is not 'Completed'
    const overdueInspections = inspections.filter(insp => {
      if (!insp.due_date) return false;
      const dueDate = new Date(insp.due_date);
      const today = new Date();
      return dueDate < today && insp.status !== 'Completed';
    }).length;
      
    const severityScores = observations.map(obs => {
      switch(obs.severity?.toUpperCase()) {
        case 'HIGH': return 5;
        case 'MEDIUM': return 3;
        case 'LOW': return 1;
        default: return 0;
      }
    });
    const avgSeverity = severityScores.length > 0 
      ? severityScores.reduce((a, b) => a + b, 0) / severityScores.length
      : 0;
    
    const onTimeInspections = inspections.filter(insp => {
      if (!insp.due_date || !insp.inspection_date) return false;
      const dueDate = new Date(insp.due_date);
      const actualDate = new Date(insp.inspection_date);
      return actualDate <= dueDate;
    }).length;
    
    const complianceRate = totalInspections > 0 
      ? (onTimeInspections / totalInspections) * 100 
      : 0;
    
    const inspectionTrend = calculateInspectionTrend(inspections);
    
    setSummaryMetrics({
      totalInspections,
      overdueInspections,
      highRiskEquipment: highRiskEquipmentData.length,
      avgSeverity: parseFloat(avgSeverity.toFixed(1)),
      inspectionTrend,
      complianceRate: parseFloat(complianceRate.toFixed(1))
    });
  };

  const calculateInspectionTrend = (currentInspections) => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentInspections = currentInspections.filter(insp => {
      const inspDate = new Date(insp.inspection_date);
      return inspDate >= threeMonthsAgo;
    }).length;
    
    const previousInspections = currentInspections.filter(insp => {
      const inspDate = new Date(insp.inspection_date);
      return inspDate >= sixMonthsAgo && inspDate < threeMonthsAgo;
    }).length;
    
    if (previousInspections === 0) return recentInspections > 0 ? 100 : 0;
    
    return ((recentInspections - previousInspections) / previousInspections) * 100;
  };

  const calculateHighRiskEquipment = (inspections, observations, equipment) => {
    const equipmentRiskData = [];
    
    equipment.forEach(eq => {
      const eqInspections = inspections.filter(
        insp => insp.equipment_tag_no === eq.equipment_tag_no
      );
      
      if (eqInspections.length === 0) return;
      
      // Sort inspections by date to check 3-month windows
      const sortedInspections = [...eqInspections].sort((a, b) => 
        new Date(a.inspection_date) - new Date(b.inspection_date)
      );
      
      // Track repeated defects within 3 months in same location
      const locationDefectTimeMap = {};
      let totalRepeatedDefects = 0;
      let locationsWithRecentRepeats = 0;
      
      // Group inspections by plant_unit_area
      sortedInspections.forEach((insp, index) => {
        const location = insp.plant_unit_area || 'Unknown';
        const defectType = insp.defect_type || 'No defect';
        const inspectionDate = new Date(insp.inspection_date);
        
        if (defectType === 'No defect') return;
        
        if (!locationDefectTimeMap[location]) {
          locationDefectTimeMap[location] = {};
        }
        
        if (!locationDefectTimeMap[location][defectType]) {
          locationDefectTimeMap[location][defectType] = {
            firstOccurrence: inspectionDate,
            lastOccurrence: inspectionDate,
            count: 1
          };
        } else {
          const defectRecord = locationDefectTimeMap[location][defectType];
          const lastOccurrence = new Date(defectRecord.lastOccurrence);
          const monthsDiff = (inspectionDate.getFullYear() - lastOccurrence.getFullYear()) * 12 + 
                            (inspectionDate.getMonth() - lastOccurrence.getMonth());
          
          // Check if within 3 months
          if (monthsDiff <= 3) {
            // This is a repeated defect within 3 months
            defectRecord.count++;
            defectRecord.lastOccurrence = inspectionDate;
            
            // Only count it as a repeat after the second occurrence
            if (defectRecord.count === 2) {
              totalRepeatedDefects++;
            }
          } else {
            // Reset if more than 3 months apart
            defectRecord.firstOccurrence = inspectionDate;
            defectRecord.lastOccurrence = inspectionDate;
            defectRecord.count = 1;
          }
        }
      });
      
      // Count locations with recent repeat issues
      Object.keys(locationDefectTimeMap).forEach(location => {
        const defectTypes = Object.keys(locationDefectTimeMap[location]);
        const hasRecentRepeats = defectTypes.some(defectType => 
          locationDefectTimeMap[location][defectType].count >= 2
        );
        
        if (hasRecentRepeats) {
          locationsWithRecentRepeats++;
        }
      });
      
      // Enhanced risk calculation
      let riskLevel = 'LOW';
      let riskScore = eqInspections.length;
      
      // Base score on repeated defects within 3 months
      riskScore += totalRepeatedDefects * 5;
      
      // Additional points for multiple locations with issues
      riskScore += locationsWithRecentRepeats * 3;
      
      // Risk level determination
      if (totalRepeatedDefects >= 3) {
        riskLevel = 'HIGH';
        riskScore += 15;
      } else if (totalRepeatedDefects >= 1) {
        riskLevel = 'MEDIUM';
        riskScore += 8;
      }
      
      // Add penalty for high inspection frequency (might indicate problems)
      if (eqInspections.length > 5) {
        riskScore += 3;
      }
      
      // Get most recent inspection date
      const lastInspection = eqInspections
        .map(insp => new Date(insp.inspection_date))
        .sort((a, b) => b - a)[0];
      
      equipmentRiskData.push({
        tag: eq.equipment_tag_no,
        description: eq.equipment_description || 'No description',
        type: eq.equipment_description?.split(' ')[0] || 'Equipment',
        location: eq.location || 'Unknown',
        findings: eqInspections.length,
        repeats: totalRepeatedDefects,
        recentRepeats: totalRepeatedDefects, // Same for now, but could track differently
        locationsWithRecentIssues: locationsWithRecentRepeats,
        riskScore,
        riskLevel,
        lastInspection: lastInspection ? lastInspection.toISOString().split('T')[0] : 'Never'
      });
    });
    
    const sortedByRisk = equipmentRiskData
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);
    
    setHighRiskEquipmentData(sortedByRisk);
    
    setSummaryMetrics(prev => ({
      ...prev,
      highRiskEquipment: equipmentRiskData.filter(eq => eq.riskLevel === 'HIGH').length
    }));
  };

  const calculateOverdueUpcoming = (inspections, equipment) => {
    const today = new Date();
    
    const overdueList = [];
    
    // Check inspections for overdue status
    inspections.forEach(insp => {
      // Check if inspection has a due date
      if (insp.due_date) {
        const dueDate = new Date(insp.due_date);
        
        // Check if the inspection is overdue (due date is in the past AND status is not 'Completed')
        if (dueDate < today && insp.status !== 'Completed') {
          const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          
          // Get equipment details
          const eq = equipment.find(e => e.equipment_tag_no === insp.equipment_tag_no);
          
          // Find observations for this inspection
          const inspectionObservations = observations.filter(
            obs => obs.inspection_id === insp.inspection_id
          );
          
          const previousFindings = inspectionObservations.length;
          
          // Use the priority from the Inspection table
          let priority = insp.priority;
          
          if (!priority || typeof priority !== 'string' || priority.trim() === '') {
            // If priority is not set in the database, calculate it
            if (daysOverdue > 60 || (daysOverdue > 30 && previousFindings > 5)) {
              priority = 'HIGH';
            } else if (daysOverdue > 30 || (daysOverdue > 7 && previousFindings > 2)) {
              priority = 'MEDIUM';
            } else {
              priority = 'LOW';
            }
          } else {
            // Format the priority from database (capitalize first letter)
            priority = priority.trim();
            priority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
          }
          
          // Ensure priority matches expected values
          const validPriorities = ['High', 'Medium', 'Low'];
          if (!validPriorities.includes(priority)) {
            priority = 'Medium';
          }
          
          overdueList.push({
            tag: insp.equipment_tag_no,
            description: eq?.equipment_description || `Equipment ${insp.equipment_tag_no}`,
            dueDate: insp.due_date,
            overdue: daysOverdue,
            priority,
            previousFindings,
            inspectionId: insp.inspection_id,
            inspectionType: insp.inspection_type || 'Regular',
            status: insp.status || 'Pending',
            reportNo: insp.report_no,
            plantUnitArea: insp.plant_unit_area
          });
        }
      }
    });
    
    // Sort by days overdue (most overdue first) and limit to 10
    setOverdueData(overdueList.sort((a, b) => b.overdue - a.overdue).slice(0, 10));
  };

  const calculateFindingsTrend = (inspections, equipment) => {
    const monthlyData = {};
    
    // Group by month
    inspections.forEach(insp => {
      if (insp.inspection_date) {
        try {
          const date = new Date(insp.inspection_date);
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          
          // Initialize month data if not exists
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              totalEquipmentInspected: 0,
              equipmentWithFindings: 0,
              totalFindings: 0,
              criticalEquipment: 0,
              totalCriticalFindings: 0
            };
          }
          
          // Count this equipment as inspected
          monthlyData[monthKey].totalEquipmentInspected++;
          
          // Get observations for this inspection
          const inspectionObservations = observations.filter(
            obs => obs.inspection_id === insp.inspection_id
          );
          
          // Count findings for this equipment
          if (inspectionObservations.length > 0) {
            monthlyData[monthKey].equipmentWithFindings++;
            monthlyData[monthKey].totalFindings += inspectionObservations.length;
            
            // Check if has critical findings (High severity or critical status)
            const hasCriticalFindings = inspectionObservations.some(obs => 
              obs.severity?.toUpperCase() === 'HIGH' || 
              obs.priority?.toUpperCase() === 'HIGH' ||
              obs.status?.toUpperCase() === 'CRITICAL'
            );
            
            if (hasCriticalFindings) {
              monthlyData[monthKey].criticalEquipment++;
              
              // Count critical findings
              const criticalCount = inspectionObservations.filter(obs => 
                obs.severity?.toUpperCase() === 'HIGH' || 
                obs.priority?.toUpperCase() === 'HIGH' ||
                obs.status?.toUpperCase() === 'CRITICAL'
              ).length;
              
              monthlyData[monthKey].totalCriticalFindings += criticalCount;
            }
          }
          
        } catch (e) {
          console.warn('Invalid inspection date:', insp.inspection_date);
        }
      }
    });
    
    // Get last 6 months
    const sortedMonths = Object.keys(monthlyData).sort();
    const last6Months = sortedMonths.slice(-6);
    
    // Format for chart display - Option 2: Show Issues per Equipment
    const trendData = last6Months.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
      const data = monthlyData[monthKey];
      
      // Calculate metrics
      const avgFindingsPerEquipment = data.totalEquipmentInspected > 0 
        ? parseFloat((data.totalFindings / data.totalEquipmentInspected).toFixed(2))
        : 0;
        
      const avgCriticalFindingsPerEquipment = data.totalEquipmentInspected > 0
        ? parseFloat((data.totalCriticalFindings / data.totalEquipmentInspected).toFixed(2))
        : 0;
        
      const equipmentIssueRate = data.totalEquipmentInspected > 0
        ? parseFloat((data.equipmentWithFindings / data.totalEquipmentInspected * 100).toFixed(1))
        : 0;
        
      const criticalEquipmentRate = data.totalEquipmentInspected > 0
        ? parseFloat((data.criticalEquipment / data.totalEquipmentInspected * 100).toFixed(1))
        : 0;
      
      return {
        month: `${monthName} ${year}`,
        // Primary metrics for chart
        avgFindingsPerEquipment: avgFindingsPerEquipment,
        avgCriticalFindingsPerEquipment: avgCriticalFindingsPerEquipment,
        
        // Secondary metrics for tooltips
        equipmentInspected: data.totalEquipmentInspected,
        equipmentWithFindings: data.equipmentWithFindings,
        criticalEquipment: data.criticalEquipment,
        equipmentIssueRate: equipmentIssueRate,
        criticalEquipmentRate: criticalEquipmentRate
      };
    });
    
    setFindingsTrendData(trendData.length > 0 ? trendData : []);
  };

  const calculateDefectTypeDistribution = (inspections) => {
    const defectTypes = {};
    
    inspections.forEach(insp => {
      if (insp.defect_type) {
        const defects = Array.isArray(insp.defect_type) ? insp.defect_type : [insp.defect_type];
        defects.forEach(defect => {
          if (defect && typeof defect === 'string') {
            const cleanDefect = defect.trim();
            if (cleanDefect) {
              defectTypes[cleanDefect] = (defectTypes[cleanDefect] || 0) + 1;
            }
          }
        });
      }
    });
    
    const defectArray = Object.entries(defectTypes)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    
    setDefectTypeData(defectArray);
  };

  const calculateRecurringDefects = (inspections) => {
  // Analyze recurring defects from inspection table with inspection type
  const defectTimeline = {};
  
  // Group inspections by equipment and defect type
  inspections.forEach(insp => {
    if (insp.defect_type && insp.equipment_tag_no && insp.inspection_date) {
      const defectType = insp.defect_type;
      const equipmentTag = insp.equipment_tag_no;
      const inspectionDate = new Date(insp.inspection_date);
      const inspectionType = insp.inspection_type || 'Regular'; // Get inspection type
      
      if (!defectTimeline[defectType]) {
        defectTimeline[defectType] = {
          totalOccurrences: 0,
          equipmentOccurrences: {},
          repeatOccurrences: 0,
          firstOccurrences: 0,
          inspectionTypes: new Set(), // Track inspection types
          equipmentDaysBetweenRepeats: {} // Track days between repeats per equipment
        };
      }
      
      defectTimeline[defectType].totalOccurrences++;
      defectTimeline[defectType].inspectionTypes.add(inspectionType);
      
      // Track occurrences by equipment
      if (!defectTimeline[defectType].equipmentOccurrences[equipmentTag]) {
        defectTimeline[defectType].equipmentOccurrences[equipmentTag] = {
          dates: [],
          inspectionTypes: [],
          count: 0
        };
      }
      
      defectTimeline[defectType].equipmentOccurrences[equipmentTag].dates.push(inspectionDate);
      defectTimeline[defectType].equipmentOccurrences[equipmentTag].inspectionTypes.push(inspectionType);
      defectTimeline[defectType].equipmentOccurrences[equipmentTag].count++;
    }
  });
  
  // Calculate repeat occurrences (same defect type on same equipment within 3 months)
  const recurringData = [];
  
  Object.entries(defectTimeline).forEach(([defectType, data]) => {
    let repeatOccurrence = 0;
    let firstOccurrence = 0;
    let totalDaysBetweenRepeats = 0;
    let repeatPairsCount = 0;
    
    // Check each equipment for repeat occurrences
    Object.values(data.equipmentOccurrences).forEach(equipmentData => {
      if (equipmentData.dates.length > 1) {
        // Sort dates
        const sortedDates = [...equipmentData.dates].sort((a, b) => a - b);
        
        // Check for occurrences within 3 months
        for (let i = 1; i < sortedDates.length; i++) {
          const daysDiff = Math.floor((sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 90) { // Within 3 months (90 days)
            // This is a repeat occurrence within 3 months
            repeatOccurrence++;
            totalDaysBetweenRepeats += daysDiff;
            repeatPairsCount++;
          } else {
            firstOccurrence++;
          }
        }
        
        // The first occurrence for this equipment
        firstOccurrence++;
      } else {
        // Only one occurrence for this equipment
        firstOccurrence++;
      }
    });
    
    if (repeatOccurrence > 0) {
      const inspectionTypesArray = Array.from(data.inspectionTypes);
      // Find most common inspection type
      const inspectionTypeCounts = {};
      Object.values(data.equipmentOccurrences).forEach(equipment => {
        equipment.inspectionTypes.forEach(type => {
          inspectionTypeCounts[type] = (inspectionTypeCounts[type] || 0) + 1;
        });
      });
      
      const mostCommonInspectionType = Object.entries(inspectionTypeCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Regular';
      
      recurringData.push({
        defectType,
        firstOccurrence,
        repeatOccurrence,
        totalOccurrences: data.totalOccurrences,
        affectedEquipment: Object.keys(data.equipmentOccurrences).length,
        avgDaysBetweenRepeat: repeatPairsCount > 0 ? Math.round(totalDaysBetweenRepeats / repeatPairsCount) : 0,
        inspectionTypes: inspectionTypesArray,
        mostCommonInspectionType
      });
    }
  });
  
  // Sort by repeat occurrences (highest first) and limit to 5
  const sortedRecurringData = recurringData
    .sort((a, b) => b.repeatOccurrence - a.repeatOccurrence)
    .slice(0, 5);
  
  setRecurringDefectsData(sortedRecurringData);
};
  const calculatePerformanceBenchmarks = (inspections, observations, equipment) => {
    const benchmarks = [];
    const today = new Date();
    
    // Calculate equipment reliability metrics
    equipment.forEach(eq => {
      const eqInspections = inspections.filter(
        insp => insp.equipment_tag_no === eq.equipment_tag_no
      );
      
      if (eqInspections.length === 0) return;
      
      // Get observations for this equipment
      const eqObservationIds = eqInspections.map(insp => insp.inspection_id);
      const eqObservations = observations.filter(
        obs => eqObservationIds.includes(obs.inspection_id)
      );
      
      const totalObservations = eqObservations.length;
      const highSeverityCount = eqObservations.filter(
        obs => obs.severity?.toUpperCase() === 'HIGH'
      ).length;
      
      // Calculate reliability score
      const inspectionCount = eqInspections.length;
      const avgDaysBetweenInspections = inspectionCount > 1 ? 
        calculateAvgDaysBetweenInspections(eqInspections) : 0;
      
      // Calculate MTBF (Mean Time Between Failures) approximation
      const failureRate = totalObservations > 0 ? 
        (totalObservations / inspectionCount) * 100 : 0;
      
      // Calculate reliability score (0-100)
      const reliabilityScore = Math.max(0, 100 - (failureRate * 2) - (highSeverityCount * 10));
      
      // Determine reliability level
      let reliabilityLevel = 'Excellent';
      if (reliabilityScore >= 90) reliabilityLevel = 'Excellent';
      else if (reliabilityScore >= 75) reliabilityLevel = 'Good';
      else if (reliabilityScore >= 60) reliabilityLevel = 'Fair';
      else reliabilityLevel = 'Poor';
      
      // Calculate maintenance effectiveness
      const completedInspections = eqInspections.filter(insp => insp.status === 'Completed').length;
      const maintenanceEffectiveness = inspectionCount > 0 ? 
        (completedInspections / inspectionCount) * 100 : 0;
      
      benchmarks.push({
        equipmentTag: eq.equipment_tag_no,
        equipmentDescription: eq.equipment_description || 'No description',
        reliabilityScore: parseFloat(reliabilityScore.toFixed(1)),
        reliabilityLevel,
        failureRate: parseFloat(failureRate.toFixed(1)),
        avgDaysBetweenInspections,
        maintenanceEffectiveness: parseFloat(maintenanceEffectiveness.toFixed(1)),
        totalInspections: inspectionCount,
        totalFindings: totalObservations,
        highSeverityFindings: highSeverityCount
      });
    });
    
    // Sort by reliability score (highest first)
    const sortedBenchmarks = benchmarks.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
    
    // Calculate overall performance score
    const overallScore = benchmarks.length > 0 ? 
      benchmarks.reduce((sum, b) => sum + b.reliabilityScore, 0) / benchmarks.length : 0;
    
    setPerformanceBenchmarks({
      equipmentReliability: sortedBenchmarks.slice(0, 8),
      maintenanceEffectiveness: sortedBenchmarks.slice(0, 5).map(b => ({
        equipment: b.equipmentTag,
        effectiveness: b.maintenanceEffectiveness,
        reliability: b.reliabilityScore
      })),
      overallScore: parseFloat(overallScore.toFixed(1))
    });
  };

  const calculateAvgDaysBetweenInspections = (inspections) => {
    if (inspections.length < 2) return 0;
    
    const dates = inspections
      .map(insp => new Date(insp.inspection_date))
      .sort((a, b) => a - b);
    
    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
      totalDays += (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
    }
    
    return parseFloat((totalDays / (dates.length - 1)).toFixed(1));
  };

  // UPDATED: Monthly Compliance Rate Calculation - No status check
  const calculateComplianceData = (inspections, equipment) => {
    const monthlyData = {};
    
    // Get unique equipment tags from equipment list
    const uniqueEquipmentTags = [...new Set(equipment.map(eq => eq.equipment_tag_no))];
    const totalEquipmentCount = uniqueEquipmentTags.length;
    
    // Group inspections by month
    inspections.forEach(insp => {
      if (insp.inspection_date) {
        try {
          const inspectionDate = new Date(insp.inspection_date);
          const monthKey = `${inspectionDate.getFullYear()}-${(inspectionDate.getMonth() + 1).toString().padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: monthKey,
              year: inspectionDate.getFullYear(),
              monthNumber: inspectionDate.getMonth() + 1,
              // Initialize counters
              inspectionsCount: 0,                // Total inspections conducted this month
              equipmentInspected: new Set(),      // Unique equipment inspected this month
              inspectionsOnTime: 0,               // Conducted on or before due date
              inspectionsOverdue: 0               // Conducted after due date
            };
          }
          
          // Count all inspections (no status check)
          monthlyData[monthKey].inspectionsCount++;
          
          // Add to equipment inspected set
          monthlyData[monthKey].equipmentInspected.add(insp.equipment_tag_no);
          
          // Check if inspection was on time (compare inspection_date with due_date)
          if (insp.due_date && insp.inspection_date) {
            const dueDate = new Date(insp.due_date);
            const inspectionDate = new Date(insp.inspection_date);
            
            if (inspectionDate <= dueDate) {
              monthlyData[monthKey].inspectionsOnTime++;
            } else {
              monthlyData[monthKey].inspectionsOverdue++;
            }
          }
          
        } catch (e) {
          console.warn('Error processing inspection date for compliance:', e);
        }
      }
    });
    
    // Get last 6 months (including current month)
    const currentDate = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      last6Months.push(monthKey);
    }
    
    // Calculate metrics for each month
    const complianceArray = last6Months.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
      const data = monthlyData[monthKey] || {
        month: monthKey,
        year: parseInt(year),
        monthNumber: parseInt(month),
        inspectionsCount: 0,
        equipmentInspected: new Set(),
        inspectionsOnTime: 0,
        inspectionsOverdue: 0
      };
      
      // Calculate metrics
      const equipmentInspectedCount = data.equipmentInspected.size;
      
      // Equipment Coverage: % of total equipment that was inspected this month
      const coverageRate = totalEquipmentCount > 0 
        ? parseFloat((equipmentInspectedCount / totalEquipmentCount * 100).toFixed(1))
        : 0;
      
      // On-time Rate: % of inspections conducted on or before due date
      const onTimeRate = data.inspectionsCount > 0
        ? parseFloat((data.inspectionsOnTime / data.inspectionsCount * 100).toFixed(1))
        : 0;
      
      // Overdue Rate: % of inspections conducted after due date
      const overdueRate = data.inspectionsCount > 0
        ? parseFloat((data.inspectionsOverdue / data.inspectionsCount * 100).toFixed(1))
        : 0;
      
      // Overall Performance Score (weighted)
      const performanceScore = totalEquipmentCount > 0
        ? parseFloat((coverageRate * 0.5 + onTimeRate * 0.5).toFixed(1))
        : 0;
      
      return {
        period: `${monthName} ${year}`,
        month: monthKey,
        monthName: monthName,
        year: year,
        
        // Primary metrics for chart
        coverageRate: coverageRate,      // Equipment Coverage
        onTimeRate: onTimeRate,          // On-time Rate
        overdueRate: overdueRate,        // Overdue Rate
        performanceScore: performanceScore, // Overall Performance
        
        // Detailed counts for tooltips
        equipmentInspected: equipmentInspectedCount,
        totalEquipment: totalEquipmentCount,
        inspectionsCount: data.inspectionsCount,
        inspectionsOnTime: data.inspectionsOnTime,
        inspectionsOverdue: data.inspectionsOverdue,
        
        // Additional metrics
        inspectionsPerEquipment: equipmentInspectedCount > 0
          ? parseFloat((data.inspectionsCount / equipmentInspectedCount).toFixed(2))
          : 0
      };
    });
    
    setComplianceData(complianceArray);
  };

  // FIXED: Pie Chart Colors - Different Colors for Each Section
  const getColorForDefectType = (index) => {
    // Use a consistent color palette for Pie Chart
    const pieColors = [
      '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D',
      '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#EF476F'
    ];
    
    // Assign colors based on index for consistent display
    return pieColors[index % pieColors.length];
  };

  const getRiskColor = useCallback((risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }, []);

  const getReliabilityColor = useCallback((score) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border border-green-200';
    if (score >= 75) return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    return 'bg-red-100 text-red-800 border border-red-200';
  }, []);

  const getTrendIcon = useCallback((trend) => {
    if (trend > 0) {
      return <ChevronUp className="inline text-red-500" size={16} />;
    } else if (trend < 0) {
      return <ChevronDown className="inline text-green-500" size={16} />;
    }
    return null;
  }, []);

  const handleExport = useCallback(async () => {
    try {
      if (!highRiskEquipmentData || highRiskEquipmentData.length === 0) {
        alert('No data to export');
        return;
      }
      
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Equipment Tag,Risk Level,Findings,Repeat Defects,Last Inspection\n" +
        highRiskEquipmentData.map(item => 
          `${item.tag},${item.riskLevel},${item.findings},${item.repeats},${item.lastInspection}`
        ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `inspection-analysis-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [highRiskEquipmentData]);

  const generateKey = (item, index, prefix = '') => {
    if (!item) return `${prefix}-null-${index}`;
    
    if (item.tag) return `${prefix}-${item.tag}-${index}`;
    if (item.inspection_id) return `${prefix}-${item.inspection_id}-${index}`;
    if (item.equipment_tag_no) return `${prefix}-${item.equipment_tag_no}-${index}`;
    
    return `${prefix}-${index}`;
  };

  // Helper function for priority distribution chart
  const getPriorityDistributionData = () => {
    const priorityData = {};
    
    inspections.forEach(insp => {
      if (insp.inspection_date && insp.priority) {
        try {
          const date = new Date(insp.inspection_date);
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          const monthName = `${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getFullYear()}`;
          
          if (!priorityData[monthKey]) {
            priorityData[monthKey] = {
              month: monthName,
              High: 0,
              Medium: 0,
              Low: 0,
              total: 0
            };
          }
          
          const priority = insp.priority.charAt(0).toUpperCase() + insp.priority.slice(1).toLowerCase();
          if (['High', 'Medium', 'Low'].includes(priority)) {
            priorityData[monthKey][priority]++;
          }
          priorityData[monthKey].total++;
          
        } catch (e) {
          console.warn('Invalid inspection date for priority chart:', insp.inspection_date);
        }
      }
    });
    
    // Get last 6 months data
    const last6Months = Object.keys(priorityData)
      .sort()
      .slice(-6)
      .map(key => {
        const data = priorityData[key];
        return {
          month: data.month,
          High: data.High,
          Medium: data.Medium,
          Low: data.Low,
          total: data.total,
          highPercent: data.total > 0 ? ((data.High / data.total) * 100).toFixed(1) : 0,
          mediumPercent: data.total > 0 ? ((data.Medium / data.total) * 100).toFixed(1) : 0,
          lowPercent: data.total > 0 ? ((data.Low / data.total) * 100).toFixed(1) : 0
        };
      });
    
    return last6Months;
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user session...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspection Analysis Module</h1>
            <p className="text-gray-600 mt-1">Analyze inspection outcomes, identify trends, and manage operational risks</p>
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Years</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
          
          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              max={endDate || new Date().toISOString().split('T')[0]}
              placeholder="Select start date"
            />
          </div>
          
          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
              placeholder="Select end date"
            />
          </div>
          
          {/* Equipment Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type</label>
            <select
              value={equipmentTypeFilter}
              onChange={(e) => setEquipmentTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Equipment</option>
              {equipmentTypes.map(type => (
                <option key={generateKey(type, type.id, 'type')} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Filter Actions */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {/* Only show Clear Filters button when there are active filters */}
            {hasActiveFilters() && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <X size={16} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={fetchData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 shadow-sm"
            >
              <Filter size={16} />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
        
      </div>

      {/* Summary Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Inspections Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 group relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">Total Inspections</p>
                <div className="relative">
                  <ClipboardCheck size={14} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="font-medium mb-1">Total Inspections</div>
                      <div className="text-gray-300">Number of inspections conducted<br />within selected date range</div>
                    </div>
                    <div className="w-2 h-2 bg-gray-800 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalInspections}</p>
              <div className="flex items-center mt-1">
                {getTrendIcon(summaryMetrics.inspectionTrend)}
                <span className={`text-sm ${summaryMetrics.inspectionTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.abs(summaryMetrics.inspectionTrend.toFixed(1))}% vs previous
                </span>
              </div>
            </div>
            <ClipboardCheck className="text-blue-500" size={24} />
          </div>
        </div>

        {/* Overdue Inspections Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 group relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">Overdue Inspections</p>
                <div className="relative">
                  <AlertTriangle size={14} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="font-medium mb-1">Overdue Inspections</div>
                      <div className="text-gray-300">Individual inspection records<br />past due date and not completed</div>
                      <div className="text-gray-400 text-xs mt-1">Based on Inspection table due_date field</div>
                    </div>
                    <div className="w-2 h-2 bg-gray-800 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">{summaryMetrics.overdueInspections}</p>
              <div className="mt-1">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                  High Priority
                </span>
              </div>
            </div>
            <AlertTriangle className="text-red-500" size={24} />
          </div>
        </div>

        {/* High-Risk Equipment Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 group relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">High-Risk Equipment</p>
                <div className="relative">
                  <ShieldAlert size={14} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="font-medium mb-1">High-Risk Equipment</div>
                      <div className="text-gray-300">Equipment with:<br />• 2+ HIGH severity findings<br />• 2+ repeat defects</div>
                      <div className="text-gray-400 text-xs mt-1">Current criteria: Severe and recurring issues</div>
                    </div>
                    <div className="w-2 h-2 bg-gray-800 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{summaryMetrics.highRiskEquipment}</p>
              <p className="text-xs text-gray-500 mt-1">Repeated failures detected</p>
            </div>
            <ShieldAlert className="text-yellow-500" size={24} />
          </div>
        </div>

        {/* Avg. Severity Score Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 group relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">Avg. Severity Score</p>
                <div className="relative">
                  <TrendingUp size={14} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="font-medium mb-1">Average Severity Score</div>
                      <div className="text-gray-300">
                        Weighted average of findings severity:<br />
                        • HIGH = 5 points<br />
                        • MEDIUM = 3 points<br />
                        • LOW = 1 point
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        {summaryMetrics.avgSeverity >= 4 ? 'High risk findings' : 
                         summaryMetrics.avgSeverity >= 2 ? 'Moderate findings' : 
                         'Low risk findings'}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-gray-800 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600">{summaryMetrics.avgSeverity.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">Based on observation severity</p>
            </div>
            <TrendingUp className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      {/* Performance Trends Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <BarChart3 className="text-blue-500 mr-2" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Performance Trends</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">Inspection findings and defect distribution trends</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {/* FIXED: Inspection Priority Distribution Chart */}
              <h3 className="font-medium text-gray-900 mb-2">Inspection Priority Distribution</h3>
              <p className="text-sm text-gray-500 mb-4">
                Distribution of inspection priorities (High, Medium, Low) over time. 
                Higher priority concentrations indicate more critical equipment or findings requiring attention.
              </p>
              
              {(() => {
                const priorityData = getPriorityDistributionData();
                return priorityData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priorityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => {
                            const dataPoint = priorityData.find(d => d[name] === value) || {};
                            switch(name) {
                              case 'High': return [`${value} (${dataPoint.highPercent}%)`, 'High Priority'];
                              case 'Medium': return [`${value} (${dataPoint.mediumPercent}%)`, 'Medium Priority'];
                              case 'Low': return [`${value} (${dataPoint.lowPercent}%)`, 'Low Priority'];
                              default: return [value, name];
                            }
                          }}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="High" stackId="a" fill="#EF4444" name="High Priority" />
                        <Bar dataKey="Medium" stackId="a" fill="#F59E0B" name="Medium Priority" />
                        <Bar dataKey="Low" stackId="a" fill="#10B981" name="Low Priority" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg">
                    <p className="text-gray-500">No priority distribution data available</p>
                  </div>
                );
              })()}
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-4">Defect Type Distribution</h3>
              {defectTypeData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={defectTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {/* FIXED: Different colors for each section */}
                        {defectTypeData.map((entry, index) => (
                          <Cell 
                            key={generateKey(entry, index, 'defect')} 
                            fill={getColorForDefectType(index)} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg">
                  <p className="text-gray-500">No defect data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Analysis Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <AlertOctagon className="text-red-500 mr-2" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Risk Analysis</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">High-risk equipment identification and recurring defect analysis</p>
        </div>
        
        <div className="p-6">
          {/* High-Risk Equipment Table - Now takes full width */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-900 mb-4">High-Risk Equipment</h3>
            {highRiskEquipmentData.length > 0 ? (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspections</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recent Repeat Issues</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {highRiskEquipmentData.map((item, index) => (
                      <tr key={generateKey(item, index, 'highrisk')} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{item.tag}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>
                            <p className="text-xs text-gray-400">{item.location}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-900">Total: {item.findings}</span>
                            {item.locationsWithRecentIssues > 0 && (
                              <span className="text-xs text-blue-600">
                                Problem areas: {item.locationsWithRecentIssues}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${item.repeats > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {item.repeats} within 3 months
                            </span>
                            {item.repeats > 0 && (
                              <span className="text-xs text-red-600 font-medium">
                                ⚠️ Same defect, same location
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRiskColor(item.riskLevel)}`}>
                            {item.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.lastInspection}
                          {item.repeats > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              {item.repeats} recent repeats
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <p className="text-gray-500">No high-risk equipment identified</p>
              </div>
            )}
          </div>

          {/* Recurring Defects Analysis - Enhanced Section */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
  <div className="border-b border-gray-200 pb-4 mb-6">
    <div className="flex items-center">
      <AlertOctagon className="text-red-500 mr-2" size={20} />
      <h2 className="text-xl font-semibold text-gray-900">Recurring Defects Analysis</h2>
    </div>
    <p className="text-sm text-gray-500 mt-1">
      Analyze defect patterns that recur across equipment within 3 months. High repeat occurrence rates indicate 
      systemic issues that may require process improvements or more frequent maintenance.
    </p>
  </div>
  
  {recurringDefectsData.length > 0 ? (
    <>
      {/* Main Chart with All Information */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Defect Occurrence Analysis</h3>
          <div className="text-sm text-gray-500">
            {recurringDefectsData.length} defect types with recurring issues
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={recurringDefectsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="defectType" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Defect Type', 
                  position: 'insideBottom', 
                  offset: -80,
                  fontSize: 14,
                  fontWeight: 'bold'
                }}
              />
              <YAxis 
                label={{ 
                  value: 'Occurrences', 
                  angle: -90, 
                  position: 'insideLeft',
                  fontSize: 14,
                  fontWeight: 'bold'
                }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-bold text-gray-900 mb-3 border-b pb-2">{label}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                              <span className="text-gray-600">First Occurrences:</span>
                            </div>
                            <span className="font-bold text-blue-600">{data.firstOccurrence}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              <span className="text-gray-600">Repeat Occurrences:</span>
                            </div>
                            <span className="font-bold text-red-600">{data.repeatOccurrence}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Occurrences:</span>
                            <span className="font-bold text-gray-900">{data.totalOccurrences}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Affected Equipment:</span>
                            <span className="font-bold text-gray-900">{data.affectedEquipment}</span>
                          </div>
                          {data.mostCommonInspectionType && (
                            <div className="flex justify-between items-center border-t pt-2 mt-2">
                              <span className="text-gray-600 font-medium">Most Common Inspection Type:</span>
                              <span className="font-bold text-purple-600">{data.mostCommonInspectionType}</span>
                            </div>
                          )}
                          {data.avgDaysBetweenRepeat > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Avg. Days Between Repeats:</span>
                              <span className="font-bold text-amber-600">{data.avgDaysBetweenRepeat} days</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              
              {/* Bars for First and Repeat Occurrences */}
              <Bar 
                dataKey="firstOccurrence" 
                fill="#3b82f6" 
                name="First Occurrences" 
                radius={[2, 2, 0, 0]}
                barSize={30}
              />
              <Bar 
                dataKey="repeatOccurrence" 
                fill="#ef4444" 
                name="Repeat Occurrences (within 3 months)" 
                radius={[2, 2, 0, 0]}
                barSize={30}
              />
              
              {/* Line for Total Occurrences */}
              <Line 
                type="monotone" 
                dataKey="totalOccurrences" 
                stroke="#8b5cf6" 
                name="Total Occurrences"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistics Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Most Common Recurring Defect */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center mb-2">
            <AlertTriangle className="text-blue-600 mr-2" size={18} />
            <div className="text-sm font-medium text-blue-800">Most Common Recurring Defect</div>
          </div>
          <div className="text-lg font-bold text-blue-900 truncate">
            {recurringDefectsData[0].defectType}
          </div>
          <div className="mt-2 text-sm text-blue-700">
            <div className="flex justify-between">
              <span>Repeats:</span>
              <span className="font-bold">{recurringDefectsData[0].repeatOccurrence}</span>
            </div>
            <div className="flex justify-between">
              <span>Inspection Type:</span>
              <span className="font-bold">{recurringDefectsData[0].mostCommonInspectionType}</span>
            </div>
          </div>
        </div>

        {/* Total Repeat Occurrences */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center mb-2">
            <TrendingUp className="text-red-600 mr-2" size={18} />
            <div className="text-sm font-medium text-red-800">Total Repeat Occurrences</div>
          </div>
          <div className="text-lg font-bold text-red-900">
            {recurringDefectsData.reduce((sum, item) => sum + item.repeatOccurrence, 0)}
          </div>
          <div className="mt-2 text-sm text-red-700">
            <div className="flex justify-between">
              <span>Across Defects:</span>
              <span className="font-bold">{recurringDefectsData.length}</span>
            </div>
          </div>
        </div>

        {/* Affected Equipment */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <Wrench className="text-green-600 mr-2" size={18} />
            <div className="text-sm font-medium text-green-800">Affected Equipment</div>
          </div>
          <div className="text-lg font-bold text-green-900">
            {recurringDefectsData.reduce((sum, item) => sum + item.affectedEquipment, 0)}
          </div>
          <div className="mt-2 text-sm text-green-700">
            <div className="flex justify-between">
              <span>% of Total:</span>
              <span className="font-bold">
                {equipmentList.length > 0 
                  ? ((recurringDefectsData.reduce((sum, item) => sum + item.affectedEquipment, 0) / equipmentList.length) * 100).toFixed(1) + '%'
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Inspection Type Summary */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center mb-2">
            <ClipboardCheck className="text-purple-600 mr-2" size={18} />
            <div className="text-sm font-medium text-purple-800">Inspection Types Involved</div>
          </div>
          <div className="text-lg font-bold text-purple-900">
            {(() => {
              const allTypes = new Set();
              recurringDefectsData.forEach(defect => {
                if (defect.inspectionTypes) {
                  defect.inspectionTypes.forEach(type => allTypes.add(type));
                }
              });
              return allTypes.size;
            })()}
          </div>
          <div className="mt-2 text-sm text-purple-700">
            <div className="truncate">
              {(() => {
                const typeCounts = {};
                recurringDefectsData.forEach(defect => {
                  if (defect.inspectionTypes) {
                    defect.inspectionTypes.forEach(type => {
                      typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });
                  }
                });
                const mostCommon = Object.entries(typeCounts)
                  .sort((a, b) => b[1] - a[1])[0];
                return mostCommon ? `Most common: ${mostCommon[0]}` : 'Various types';
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table with All Information */}
      <div className="mt-8">
        <h4 className="font-medium text-gray-900 mb-4">Detailed Defect Analysis</h4>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Defect Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Occurrences</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repeat Occurrences</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affected Equipment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Days Between</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Most Common Inspection Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recurringDefectsData.map((item, index) => (
                <tr key={`defect-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.defectType}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="font-bold text-blue-600">{item.firstOccurrence}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="font-bold text-red-600">{item.repeatOccurrence}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">{item.totalOccurrences}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-900">{item.affectedEquipment}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={item.avgDaysBetweenRepeat > 0 ? "text-amber-600 font-medium" : "text-gray-500"}>
                      {item.avgDaysBetweenRepeat > 0 ? `${item.avgDaysBetweenRepeat} days` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-purple-600">{item.mostCommonInspectionType}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    <div className="h-64 flex flex-col items-center justify-center border border-gray-200 rounded-lg">
      <AlertOctagon className="text-gray-400 mb-3" size={32} />
      <p className="text-gray-500 font-medium">No recurring defect data available</p>
      <p className="text-sm text-gray-400 mt-1">No defects have repeated within 3 months</p>
    </div>
  )}
</div>
        </div>
      </div>

      {/* Overdue & Upcoming Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <Clock className="text-orange-500 mr-2" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Overdue & Upcoming Inspections</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">Timely inspection tracking and scheduling</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-4">
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <h3 className="font-medium text-red-900">Overdue Inspections</h3>
              </div>
              
              {overdueData.length > 0 ? (
                <div className="overflow-x-auto border border-red-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Equipment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Inspection Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Days Overdue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {overdueData.map((item, index) => (
                        <tr key={generateKey(item, index, 'overdue')} className="hover:bg-red-50">
                          <td className="px-3 py-3">
                            <p className="font-medium text-gray-900">{item.tag}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{item.inspectionType}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="whitespace-nowrap">
                              <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                {item.overdue} days
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(item.dueDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border border-gray-200 rounded-lg">
                  <AlertCircle className="mx-auto text-gray-400 mb-3" size={32} />
                  <p className="text-gray-500 font-medium">No overdue inspections at this time</p>
                  <p className="text-sm text-gray-400 mt-1">All inspections are either completed or not yet due</p>
                </div>
              )}
            </div>

           <div>
  <div className="flex items-center mb-4">
    <CalendarClock className="text-blue-500 mr-2" size={20} />
    <h3 className="font-medium text-blue-900">Upcoming Inspection Schedules</h3>
  </div>
  
  {(() => {
    // Filter for "Confirmed" status only (not "Completed")
    const confirmedSchedules = upcomingSchedules.filter(schedule => 
      schedule.status === 'Confirmed'
    );
    
    return confirmedSchedules.length > 0 ? (
      <div className="overflow-x-auto border border-blue-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Equipment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Scheduled Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Days Until</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {confirmedSchedules.slice(0, 5).map((schedule, index) => (
              <tr key={`confirmed-${schedule.scheduleId || index}`} className="hover:bg-blue-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{schedule.equipmentTag}</p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{schedule.equipmentDescription}</p>
                    <p className="text-xs text-gray-400 mt-1">{schedule.location}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-900">{schedule.scheduledDate}</span>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{schedule.startTime}</span>
                      <span className="mx-1">-</span>
                      <span className="font-medium">{schedule.endTime}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`
                    px-4 py-1 text-xs font-medium rounded-full whitespace-nowrap
                    ${schedule.daysUntil === 0 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      schedule.daysUntil <= 3 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      schedule.daysUntil <= 7 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-green-100 text-green-800 border border-green-200'}
                  `}>
                    {schedule.daysUntil === 0 ? 'Today' :
                    schedule.daysUntil === 1 ? 'Tomorrow' :
                    `${schedule.daysUntil} days`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRiskColor(schedule.priority)}`}>
                    {schedule.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-8 border border-gray-200 rounded-lg">
        <CalendarClock className="mx-auto text-gray-400 mb-3" size={32} />
        <p className="text-gray-500 font-medium">No confirmed upcoming inspection schedules</p>
        <p className="text-sm text-gray-400 mt-1">Only schedules with "Confirmed" status appear here</p>
      </div>
    );
  })()}
</div>
          </div>

          {/* Completed Inspections Section */}
<div className="mt-8 pt-6 border-t border-gray-200">
  <div className="flex items-center mb-4">
    <CheckCircle className="text-green-500 mr-2" size={20} />
    <h3 className="font-medium text-green-900">Recently Completed Inspections</h3>
  </div>
  
  {(() => {
    // Filter completed schedules from the upcomingSchedules data
    const completedSchedules = upcomingSchedules.filter(schedule => 
      schedule.status === 'Completed'
    );
    
    // Also get completed inspections from the Inspection table
    const completedInspections = inspections.filter(insp => 
      insp.status === 'Completed'
    ).slice(0, 5);
    
    console.log('Completed schedules:', completedSchedules);
    console.log('Completed inspections:', completedInspections);
    
    // Create a map of equipment to engineer from completed schedules
    const equipmentEngineerMap = {};
    completedSchedules.forEach(schedule => {
      console.log('Schedule engineer:', {
        tag: schedule.equipmentTag,
        engineerId: schedule.engineerId,
        engineerName: schedule.engineerName
      });
      equipmentEngineerMap[schedule.equipmentTag] = {
        engineerName: schedule.engineerName,
        engineerId: schedule.engineerId,
        engineerEmail: schedule.engineerEmail
      };
    });
    
    // Combine both data sources
    const allCompleted = [
      ...completedSchedules.map(schedule => ({
        scheduleId: schedule.scheduleId,
        equipmentTag: schedule.equipmentTag,
        equipmentDescription: schedule.equipmentDescription,
        location: schedule.location,
        scheduledDate: schedule.scheduledDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        status: 'Completed',
        priority: schedule.priority || 'Medium',
        completedDate: schedule.scheduledDate,
        engineerId: schedule.engineerId,
        engineerName: schedule.engineerName,
        engineerEmail: schedule.engineerEmail,
        source: 'Schedule'
      })),
      ...completedInspections.map(insp => {
        // Check if there's engineer info for this equipment from schedules
        const equipmentInfo = equipmentEngineerMap[insp.equipment_tag_no] || {};
        
        console.log('Inspection engineer check:', {
          equipmentTag: insp.equipment_tag_no,
          foundEngineer: equipmentInfo.engineerName,
          hasEngineerId: !!insp.engineer_id
        });
        
        return {
          scheduleId: insp.inspection_id,
          equipmentTag: insp.equipment_tag_no,
          equipmentDescription: equipmentList.find(eq => eq.equipment_tag_no === insp.equipment_tag_no)?.equipment_description || 'Unknown',
          location: equipmentList.find(eq => eq.equipment_tag_no === insp.equipment_tag_no)?.location || 'Unknown',
          scheduledDate: insp.inspection_date,
          startTime: 'N/A',
          endTime: 'N/A',
          status: 'Completed',
          priority: insp.priority || 'Medium',
          completedDate: insp.inspection_date,
          engineerId: insp.engineer_id || equipmentInfo.engineerId,
          engineerName: insp.engineer_name || equipmentInfo.engineerName || 'Not recorded',
          engineerEmail: equipmentInfo.engineerEmail || '',
          source: 'Inspection'
        };
      })
    ];
    
    console.log('All completed data:', allCompleted);
    
    // Sort by date (most recent first) and limit to 8
    const sortedCompleted = allCompleted
      .sort((a, b) => new Date(b.completedDate || b.scheduledDate) - new Date(a.completedDate || a.scheduledDate))
      .slice(0, 8);
    
    return sortedCompleted.length > 0 ? (
      <div className="overflow-x-auto border border-green-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-green-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Equipment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Completion Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Checked By (Engineer)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedCompleted.map((item, index) => (
              <tr key={`completed-${item.scheduleId || item.inspection_id || index}`} className="hover:bg-green-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.equipmentTag}</p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{item.equipmentDescription}</p>
                    {item.location && (
                      <p className="text-xs text-gray-400 mt-1">{item.location}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(item.completedDate || item.scheduledDate).toLocaleDateString()}
                    </span>
                    {(item.startTime !== 'N/A' && item.endTime !== 'N/A') && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">{item.startTime}</span>
                        <span className="mx-1">-</span>
                        <span className="font-medium">{item.endTime}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    {/* DEBUG: Show what we have */}
                    <div className="text-sm font-medium text-gray-900">
                      Engineer ID: {item.engineerId || 'No ID'}
                    </div>
                    
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`
                    px-3 py-1 text-xs font-medium rounded-full
                    ${item.status === 'Completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                      item.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'}
                  `}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRiskColor(item.priority)}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-500 italic">
                    {item.source === 'Schedule' ? 'Scheduled inspection' : 'From Inspection table'}
                    {item.engineerName === 'Not recorded' && item.source === 'Inspection' && (
                      <p className="text-red-500 mt-1">No engineer recorded</p>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-8 border border-gray-200 rounded-lg">
        <CheckCircle className="mx-auto text-gray-400 mb-3" size={32} />
        <p className="text-gray-500 font-medium">No recently completed inspections found</p>
        <p className="text-sm text-gray-400 mt-1">Completed inspections will appear here</p>
      </div>
    );
  })()}
</div>
        </div>
      </div>
    </div>
  );
}

export default Analysis;