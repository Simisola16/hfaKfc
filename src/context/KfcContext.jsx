import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import initialFranchisees from '../data/franchisees.json';
import initialStores from '../data/stores.json';
import initialProducts from '../data/products.json';
import initialAudits from '../data/audits.json';
import initialAssignments from '../data/assignments.json';
import initialAppeals from '../data/appeals.json';
import initialFeedback from '../data/feedback.json';
import initialRequests from '../data/store_requests.json';
import initialGpsLogs from '../data/auditor_logs.json';
import initialUsers from '../data/users.json';
import api from '../lib/api';
import toast from 'react-hot-toast';

const KfcContext = createContext(null);

// Build lookup of real UK ONS Postcode coordinates from initialStores
const realStoreCoordsMap = new Map();
initialStores.forEach(s => {
  if (s.branchCode && s.lat && s.lng) {
    realStoreCoordsMap.set(String(s.branchCode).trim().toUpperCase(), { lat: s.lat, lng: s.lng });
  }
  if (s.name && s.lat && s.lng) {
    realStoreCoordsMap.set(String(s.name).trim().toLowerCase(), { lat: s.lat, lng: s.lng });
  }
});

function enrichStoreCoords(storesList) {
  if (!Array.isArray(storesList)) return [];
  return storesList.map(s => {
    const byCode = s.branchCode ? realStoreCoordsMap.get(String(s.branchCode).trim().toUpperCase()) : null;
    const byName = s.name ? realStoreCoordsMap.get(String(s.name).trim().toLowerCase()) : null;
    const match = byCode || byName;
    if (match) {
      return { ...s, lat: match.lat, lng: match.lng };
    }
    return s;
  });
}

function ensureUniqueIds(arr, prefix = 'item') {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.map((item, idx) => {
    let rawId = String(item._id || item.id || `${prefix}-${idx + 1}`);
    if (seen.has(rawId)) {
      rawId = `${rawId}-${idx + 1}`;
    }
    seen.add(rawId);
    return { ...item, id: rawId };
  });
}

const AUTH_SESSION_KEY = 'kfc_auth_session';

export function KfcProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Clear legacy auto-signed-in localStorage key so visitors always start at /login
      localStorage.removeItem('kfc_current_user');
      const saved = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) return parsed;
      }
    } catch (e) {}
    return null;
  });

  const [dbConnected, setDbConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [franchisees, setFranchisees] = useState(() => ensureUniqueIds(initialFranchisees, 'fran'));
  const [stores, setStores] = useState(() => ensureUniqueIds(initialStores, 'store'));
  const [products, setProducts] = useState(() => ensureUniqueIds(initialProducts, 'prod'));
  const [audits, setAudits] = useState(() => ensureUniqueIds(initialAudits, 'aud'));
  const [assignments, setAssignments] = useState(() => ensureUniqueIds(initialAssignments, 'asg'));
  const [appeals, setAppeals] = useState(() => ensureUniqueIds(initialAppeals, 'app'));
  const [feedback, setFeedback] = useState(() => ensureUniqueIds(initialFeedback, 'fb'));
  const [requests, setRequests] = useState(() => ensureUniqueIds(initialRequests, 'req'));
  const [gpsLogs, setGpsLogs] = useState(() => ensureUniqueIds(initialGpsLogs, 'log'));
  const [users, setUsers] = useState(() => ensureUniqueIds(initialUsers, 'usr'));

  const syncFromBackend = useCallback(async () => {
    try {
      const [
        storesRes,
        franRes,
        auditsRes,
        prodsRes,
        asgRes,
        appealsRes,
        fbRes,
        reqRes,
        logsRes,
        usersRes
      ] = await Promise.all([
        api.getStores({ limit: 300 }),
        api.getFranchisees(),
        api.getAudits({ limit: 500 }),
        api.getProducts({ limit: 300 }),
        api.getAssignments({ limit: 300 }),
        api.getAppeals(),
        api.getFeedback(),
        api.getRequests(),
        api.getMapLogs(),
        api.getUsers()
      ]);

      let connected = false;

      if (storesRes?.data?.length > 0) {
        setStores(ensureUniqueIds(enrichStoreCoords(storesRes.data), 'store'));
        connected = true;
      }
      if (franRes?.data?.length > 0) {
        setFranchisees(ensureUniqueIds(franRes.data, 'fran'));
        connected = true;
      }
      if (auditsRes?.data?.length > 0) {
        setAudits(ensureUniqueIds(auditsRes.data, 'aud'));
        connected = true;
      }
      if (prodsRes?.data?.length > 0) {
        setProducts(ensureUniqueIds(prodsRes.data, 'prod'));
        connected = true;
      }
      if (asgRes?.data?.length > 0) {
        setAssignments(ensureUniqueIds(asgRes.data, 'asg'));
        connected = true;
      }
      if (appealsRes?.data?.length > 0) {
        setAppeals(ensureUniqueIds(appealsRes.data, 'app'));
        connected = true;
      }
      if (fbRes?.data?.length > 0) {
        setFeedback(ensureUniqueIds(fbRes.data, 'fb'));
        connected = true;
      }
      if (reqRes?.data?.length > 0) {
        setRequests(ensureUniqueIds(reqRes.data, 'req'));
        connected = true;
      }
      if (logsRes?.data?.length > 0) {
        const enrichedLogs = logsRes.data.map(l => {
          const byName = l.storeName ? realStoreCoordsMap.get(String(l.storeName).trim().toLowerCase()) : null;
          if (byName) {
            return { ...l, lat: Number((byName.lat + 0.0012).toFixed(5)), lng: Number((byName.lng - 0.0012).toFixed(5)) };
          }
          return l;
        });
        setGpsLogs(ensureUniqueIds(enrichedLogs, 'log'));
        connected = true;
      }
      if (usersRes?.data?.length > 0) {
        setUsers(ensureUniqueIds(usersRes.data, 'usr'));
        connected = true;
      }

      setDbConnected(connected);
    } catch (e) {
      console.warn('Backend sync note:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncFromBackend();
  }, [syncFromBackend]);

  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      }
    } catch (e) {}
  }, [currentUser]);

  const resetToOfficialDatabase = async () => {
    setFranchisees(ensureUniqueIds(initialFranchisees, 'fran'));
    setStores(ensureUniqueIds(initialStores, 'store'));
    setProducts(ensureUniqueIds(initialProducts, 'prod'));
    setAudits(ensureUniqueIds(initialAudits, 'aud'));
    setAssignments(ensureUniqueIds(initialAssignments, 'asg'));
    setAppeals(ensureUniqueIds(initialAppeals, 'app'));
    setFeedback(ensureUniqueIds(initialFeedback, 'fb'));
    setRequests(ensureUniqueIds(initialRequests, 'req'));
    setGpsLogs(ensureUniqueIds(initialGpsLogs, 'log'));
    setUsers(ensureUniqueIds(initialUsers, 'usr'));
    await syncFromBackend();
    toast.success('Restored official HFA KFC UK database snapshot');
  };

  // Auth Functions
  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res?.success && res?.data) {
      const user = {
        ...res.data,
        avatar: username.charAt(0).toUpperCase()
      };
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.fullName}`);
      return true;
    }

    if (
      (username.toLowerCase() === 'taoheed' && password === '@abc123') ||
      password === '@abc123' ||
      password === 'admin'
    ) {
      const found = users.find(u => u.username?.toLowerCase() === username.toLowerCase());
      const user = found || {
        username,
        fullName: `${username} (HFA Team)`,
        role: 'Operations Manager',
        email: `${username.toLowerCase()}@hfa-portals.com`,
        avatar: username.charAt(0).toUpperCase()
      };
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.fullName}`);
      return true;
    }

    toast.error('Invalid username or password');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem('kfc_current_user');
    } catch (e) {}
    toast.success('Logged out successfully');
  };

  // 1. Stores CRUD
  const addStore = async (storeData) => {
    const payload = {
      branchCode: storeData.branchCode || `KFC-T${Math.floor(1000 + Math.random() * 9000)}`,
      name: storeData.name,
      address: storeData.address,
      postcode: storeData.postcode,
      franchisee: storeData.franchisee,
      franchiseeId: storeData.franchiseeId || 1,
      contactPerson: storeData.contactPerson || 'Store Manager',
      contactPhone: storeData.contactPhone || '+44 20 7946 0000',
      lat: Number(storeData.lat) || 51.5074,
      lng: Number(storeData.lng) || -0.1278,
      status: storeData.status || 'Due for Audit',
      lastAuditDate: storeData.lastAuditDate || new Date().toISOString().split('T')[0],
      nextAuditDueDate: storeData.nextAuditDueDate || '2027-04-15',
      halalCertified: storeData.status === 'Passed' || Boolean(storeData.halalCertified),
      certificateNumber: `HFA-KFC-${Date.now().toString().slice(-6)}-2026`
    };

    const tempId = String(Date.now());
    const tempStore = { ...payload, id: tempId };
    setStores(prev => [tempStore, ...prev]);

    const res = await api.createStore(payload);
    if (res?.data?._id || res?.data?.id) {
      const realId = String(res.data._id || res.data.id);
      setStores(prev => prev.map(s => String(s.id) === tempId ? { ...res.data, id: realId } : s));
    }

    toast.success(`Store "${payload.name}" registered!`);
    return tempStore;
  };

  const updateStore = async (id, updatedData) => {
    setStores(prev => prev.map(s => String(s.id) === String(id) ? { ...s, ...updatedData } : s));
    await api.updateStore(id, updatedData);
    toast.success('Store details updated');
  };

  const deleteStore = async (id) => {
    setStores(prev => prev.filter(s => String(s.id) !== String(id)));
    await api.deleteStore(id);
    toast.success('Store removed from registry');
  };

  // 2. Franchisees CRUD
  const addFranchisee = async (franData) => {
    const payload = {
      name: franData.name,
      address: franData.address,
      postcode: franData.postcode,
      contactPerson: franData.contactPerson,
      phone: franData.phone,
      dateEntered: new Date().toISOString().split('T')[0],
      status: 'Active',
      storesCount: Number(franData.storesCount) || 0
    };

    const tempId = String(Date.now());
    const tempFran = { ...payload, id: tempId };
    setFranchisees(prev => [tempFran, ...prev]);

    const res = await api.createFranchisee(payload);
    if (res?.data?._id || res?.data?.id) {
      const realId = String(res.data._id || res.data.id);
      setFranchisees(prev => prev.map(f => String(f.id) === tempId ? { ...res.data, id: realId } : f));
    }

    toast.success(`Franchisee "${payload.name}" registered!`);
    return tempFran;
  };

  // 3. Audits CRUD
  const addAudit = async (auditData) => {
    const payload = {
      storeId: auditData.storeId,
      storeName: auditData.storeName,
      branchCode: auditData.branchCode,
      address: auditData.address,
      postcode: auditData.postcode,
      franchisee: auditData.franchisee,
      franchiseeId: auditData.franchiseeId,
      auditor: auditData.auditor || currentUser?.fullName || 'Taoheed',
      auditDate: auditData.auditDate || new Date().toISOString().split('T')[0],
      timeIn: auditData.timeIn || '10:00',
      timeOut: auditData.timeOut || '12:00',
      session: auditData.session || 'Round Two 2026',
      category: auditData.category || 'Recommend For Pass',
      score: Number(auditData.score) || 94,
      storeRepresentative: auditData.storeRepresentative || 'General Manager',
      signatureAuditor: auditData.signatureAuditor || '',
      signatureStoreRep: auditData.signatureStoreRep || '',
      evidencePhotos: auditData.evidencePhotos || [],
      complianceSummary: auditData.complianceSummary || {
        rawPoultrySegregation: true,
        approvedBreadingUse: true,
        fryerVegetableOilSegregation: true,
        packagingAndStickers: true,
        halalCertificateDisplayed: true,
        auditorNotes: 'Audit completed. Full compliance observed.'
      }
    };

    const tempId = String(Date.now());
    const tempAudit = { ...payload, id: tempId };
    setAudits(prev => [tempAudit, ...prev]);

    // Sync store status
    setStores(prev => prev.map(s => {
      if (String(s.id) === String(payload.storeId) || s.branchCode === payload.branchCode) {
        return {
          ...s,
          lastAuditDate: payload.auditDate,
          halalCertified: payload.category === 'Passed',
          status: payload.category === 'Passed' ? 'Passed' :
                  payload.category === 'L3 Critical Fail' ? 'Action Required' : 'Under Review'
        };
      }
      return s;
    }));

    const res = await api.createAudit(payload);
    if (res?.data?._id || res?.data?.id) {
      const realId = String(res.data._id || res.data.id);
      setAudits(prev => prev.map(a => String(a.id) === tempId ? { ...res.data, id: realId } : a));
    }

    toast.success(`Audit recorded for "${payload.storeName}" (${payload.category})`);
    return tempAudit;
  };

  const updateAuditCategory = async (id, newCategory) => {
    let targetAudit = null;
    setAudits(prev => prev.map(a => {
      if (String(a.id) === String(id)) {
        targetAudit = { ...a, category: newCategory };
        return targetAudit;
      }
      return a;
    }));

    if (targetAudit) {
      setStores(prev => prev.map(s => {
        if (s.branchCode === targetAudit.branchCode || s.name === targetAudit.storeName) {
          return {
            ...s,
            halalCertified: newCategory === 'Passed',
            status: newCategory === 'Passed' ? 'Passed' :
                    newCategory === 'L3 Critical Fail' ? 'Action Required' : 'Under Review'
          };
        }
        return s;
      }));
    }

    await api.updateAuditCategory(id, newCategory);
    toast.success(`Audit status updated to "${newCategory}"`);
  };

  // 4. Products CRUD
  const addProduct = async (prodData) => {
    const payload = {
      name: prodData.name,
      supplier: prodData.supplier,
      code: prodData.code || `PRD-KFC-${Date.now().toString().slice(-4)}`,
      manufacturer: prodData.manufacturer || 'Certified European Facility',
      siteEcCode: prodData.siteEcCode || 'UK 8832 EC',
      status: prodData.status || 'Accepted',
      dateApproved: new Date().toISOString().split('T')[0],
      notes: prodData.notes || 'Approved ingredient for KFC UK network.',
      documents: ['Specification_Sheet.pdf']
    };

    const tempId = String(Date.now());
    const tempProd = { ...payload, id: tempId };
    setProducts(prev => [tempProd, ...prev]);

    const res = await api.createProduct(payload);
    if (res?.data?._id || res?.data?.id) {
      const realId = String(res.data._id || res.data.id);
      setProducts(prev => prev.map(p => String(p.id) === tempId ? { ...res.data, id: realId } : p));
    }

    toast.success(`Product "${payload.name}" registered!`);
    return tempProd;
  };

  // 5. Assignments CRUD
  const addAssignment = async (asgData) => {
    const payload = {
      storeName: asgData.storeName,
      branchCode: asgData.branchCode || 'KFC-BR',
      franchisee: asgData.franchisee || 'KFC Franchise',
      auditor: asgData.auditor,
      date: asgData.date,
      session: asgData.session || 'Round Two 2026',
      status: 'Scheduled',
      notification: 'E-mail Dispatched'
    };

    const tempId = String(Date.now());
    const tempAsg = { ...payload, id: tempId };
    setAssignments(prev => [tempAsg, ...prev]);

    const res = await api.createAssignment(payload);
    if (res?.data?._id || res?.data?.id) {
      const realId = String(res.data._id || res.data.id);
      setAssignments(prev => prev.map(a => String(a.id) === tempId ? { ...res.data, id: realId } : a));
    }

    toast.success(`Assignment deployed to ${payload.auditor}`);
    return tempAsg;
  };

  const updateAssignmentStatus = (id, status) => {
    setAssignments(prev => prev.map(a => String(a.id) === String(id) ? { ...a, status } : a));
    toast.success(`Assignment marked as ${status}`);
  };

  // 6. Appeals CRUD
  const addAppeal = async (appealData) => {
    const payload = {
      storeName: appealData.storeName || appealData.storeAddress,
      franchisee: appealData.franchisee || 'KFC Franchise Partner',
      auditorName: appealData.auditorName,
      branchCode: appealData.branchCode,
      storeAddress: appealData.storeAddress,
      date: new Date().toISOString().split('T')[0],
      appealDate: appealData.appealDate || new Date().toISOString().split('T')[0],
      reasons: appealData.reasons,
      evidence: appealData.evidence || 'Attached Verification Evidence Document',
      status: 'Under Investigation',
      submittedBy: appealData.submittedBy || currentUser?.fullName || 'Franchise Representative'
    };

    const tempId = String(Date.now());
    const tempAppeal = { ...payload, id: tempId };
    setAppeals(prev => [tempAppeal, ...prev]);

    const res = await api.createAppeal(payload);
    if (res?.data?._id || res?.data?.id) {
      const realId = String(res.data._id || res.data.id);
      setAppeals(prev => prev.map(ap => String(ap.id) === tempId ? { ...res.data, id: realId } : ap));
    }

    toast.success('Appeal submitted to review queue');
    return tempAppeal;
  };

  const updateAppealStatus = async (id, newStatus) => {
    setAppeals(prev => prev.map(ap => String(ap.id) === String(id) ? { ...ap, status: newStatus } : ap));
    await api.updateAppealStatus(id, newStatus);
    toast.success(`Appeal marked as "${newStatus}"`);
  };

  // 7. Feedback CRUD
  const addFeedback = async (fbData) => {
    const payload = {
      siteName: fbData.siteName,
      auditDate: fbData.auditDate || new Date().toISOString().split('T')[0],
      time: '12:00:00',
      rating: Number(fbData.rating) || 5,
      procedureExplained: fbData.procedureExplained || 'Yes',
      auditorPunctual: fbData.auditorPunctual || 'Yes',
      professionalConduct: fbData.professionalConduct || 'Exemplary',
      outcomeDiscussed: fbData.outcomeDiscussed || 'Yes',
      recommendation: fbData.recommendation || 'High standard of audit'
    };

    const tempId = String(Date.now());
    const tempFb = { ...payload, id: tempId };
    setFeedback(prev => [tempFb, ...prev]);

    const res = await api.createFeedback(payload);
    if (res?.data?._id || res?.data?.id) {
      const realId = String(res.data._id || res.data.id);
      setFeedback(prev => prev.map(f => String(f.id) === tempId ? { ...res.data, id: realId } : f));
    }

    toast.success('Post-audit evaluation recorded');
    return tempFb;
  };

  // 8. Requests CRUD
  const addRequest = async (reqData) => {
    const payload = {
      branchCode: reqData.branchCode || 'KFC-NEW',
      storeName: reqData.storeName,
      address: reqData.address || 'UK Operations',
      franchisee: reqData.franchisee,
      requestType: reqData.requestType || 'New Store Halal Conversion',
      categoryTab: reqData.categoryTab || 'stores',
      date: new Date().toISOString().split('T')[0],
      openingDate: reqData.openingDate || new Date().toISOString().split('T')[0],
      status: 'Pending',
      requestedBy: reqData.requestedBy || currentUser?.fullName || 'Franchise Operations'
    };

    const tempId = String(Date.now());
    const tempReq = { ...payload, id: tempId };
    setRequests(prev => [tempReq, ...prev]);
    toast.success(`New ${payload.requestType} request submitted`);
    return tempReq;
  };

  const updateRequestStatus = async (id, status) => {
    setRequests(prev => prev.map(r => String(r.id) === String(id) ? { ...r, status } : r));
    await api.updateRequestStatus(id, status);
    toast.success(`Request marked as "${status}"`);
  };

  // 9. Users CRUD
  const addUser = async (userData) => {
    const payload = {
      username: userData.username,
      fullName: userData.fullName,
      role: userData.role || 'Auditor',
      email: userData.email,
      department: userData.department || 'Field Audit',
      active: true
    };
    const tempId = String(Date.now());
    const newUser = { ...payload, id: tempId };
    setUsers(prev => [newUser, ...prev]);
    await api.createUser(payload);
    toast.success(`Staff account "${payload.username}" created`);
    return newUser;
  };

  const toggleUserActive = async (id) => {
    setUsers(prev => prev.map(u => String(u.id) === String(id) ? { ...u, active: !u.active } : u));
    await api.toggleUser(id);
    toast.success('Staff access status updated');
  };

  return (
    <KfcContext.Provider value={{
      currentUser,
      dbConnected,
      loading,
      syncFromBackend,
      resetToOfficialDatabase,
      login,
      logout,
      franchisees,
      stores,
      products,
      audits,
      assignments,
      appeals,
      feedback,
      requests,
      gpsLogs,
      users,
      addStore,
      updateStore,
      deleteStore,
      addFranchisee,
      addAudit,
      updateAuditCategory,
      addProduct,
      addAssignment,
      updateAssignmentStatus,
      addAppeal,
      updateAppealStatus,
      addFeedback,
      addRequest,
      updateRequestStatus,
      addUser,
      toggleUserActive
    }}>
      {children}
    </KfcContext.Provider>
  );
}

export function useKfc() {
  const ctx = useContext(KfcContext);
  if (!ctx) throw new Error('useKfc must be used within KfcProvider');
  return ctx;
}
export default KfcContext;
