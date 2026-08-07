import { create } from 'zustand';
import type {
  Workspace,
  Department,
  Team,
  Project,
  Task,
  Comment,
  ActivityLogEntry,
  PayrollEntry,
  PayrollStatus
} from '../types';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  departments: Department[];
  teams: Team[];
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  comments: Comment[];
  activityLog: ActivityLogEntry[];
  payroll: PayrollEntry[];

  // Fetch all initial data
  fetchAllData: (workspaceId: string) => Promise<void>;
  
  // Department Actions
  addDepartment: (department: Omit<Department, 'id'>) => Promise<void>;
  updateDepartment: (id: string, department: Partial<Department>) => void;
  deleteDepartment: (id: string) => Promise<void>;

  // Project Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => Promise<void>;

  // Task Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Payroll Actions
  updatePayrollStatus: (id: string, status: PayrollStatus) => void;
  addPayrollEntry: (entry: PayrollEntry) => void;

  // Getters
  getTasksByDepartment: (deptId: string) => Task[];
  getTasksByAssignee: (userId: string) => Task[];
  getProjectsByDepartment: (deptId: string) => Project[];
}

const getToken = () => localStorage.getItem('token');

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  departments: [],
  teams: [],
  projects: [],
  currentProject: null,
  tasks: [],
  comments: [],
  activityLog: [],
  payroll: [],

  fetchAllData: async (workspaceId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const [deptRes, projRes] = await Promise.all([
        fetch(`/api/departments/${workspaceId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/projects/${workspaceId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (deptRes.ok && projRes.ok) {
        const departments = await deptRes.json();
        const projects = await projRes.json();
        
        set({ departments, projects });
        
        // Fetch tasks for all projects
        const allTasks: Task[] = [];
        for (const proj of projects) {
          const tRes = await fetch(`/api/tasks/${proj.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (tRes.ok) {
            allTasks.push(...await tRes.json());
          }
        }
        set({ tasks: allTasks });
      }
    } catch (error) {
      console.error('Failed to fetch workspace data', error);
    }
  },

  addDepartment: async (deptData) => {
    const token = getToken();
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(deptData)
    });
    if (res.ok) {
      const newDept = await res.json();
      // Map to department UI format
      const mappedDept = { ...newDept, memberCount: 0, budget: 0, expenses: 0, goals: [] };
      set(state => ({ departments: [...state.departments, mappedDept] }));
    }
  },

  updateDepartment: (id, updatedFields) =>
    set((state) => ({
      departments: state.departments.map((dept) =>
        dept.id === id ? { ...dept, ...updatedFields } : dept
      ),
    })),
    
  deleteDepartment: async (id) => {
    const token = getToken();
    const res = await fetch(`/api/departments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      set(state => ({ departments: state.departments.filter(d => d.id !== id) }));
    }
  },

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  
  addProject: async (projectData) => {
    const token = getToken();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(projectData)
    });
    if (res.ok) {
      const newProj = await res.json();
      set(state => ({ projects: [...state.projects, newProj] }));
    }
  },
  
  updateProject: (id, updatedFields) =>
    set((state) => ({
      projects: state.projects.map((proj) =>
        proj.id === id ? { ...proj, ...updatedFields } : proj
      ),
      currentProject: state.currentProject?.id === id 
        ? { ...state.currentProject, ...updatedFields }
        : state.currentProject
    })),
    
  deleteProject: async (id) => {
    const token = getToken();
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject
      }));
    }
  },

  setTasks: (tasks) => set({ tasks }),
  
  addTask: async (taskData) => {
    const token = getToken();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(taskData)
    });
    if (res.ok) {
      const newTask = await res.json();
      set(state => ({ tasks: [...state.tasks, newTask] }));
    }
  },
  
  updateTask: async (id, updatedFields) => {
    const token = getToken();
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(updatedFields)
    });
    if (res.ok) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updatedFields } : task
        ),
      }));
    }
  },
  
  deleteTask: async (id) => {
    const token = getToken();
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
    }
  },

  updatePayrollStatus: (id, status) =>
    set((state) => ({
      payroll: state.payroll.map((entry) =>
        entry.id === id ? { ...entry, status } : entry
      ),
    })),
    
  addPayrollEntry: (entry) =>
    set((state) => ({ payroll: [...state.payroll, entry] })),

  getTasksByDepartment: (deptId: string) => {
    return get().tasks.filter((task) => (task as any).departmentId === deptId || task.projectId === deptId); 
  },
  getTasksByAssignee: (userId: string) => {
    return get().tasks.filter((task) => task.assigneeId === userId);
  },
  getProjectsByDepartment: (deptId: string) => {
    return get().projects.filter((project) => (project as any).departmentId === deptId || (project as any).teamId === deptId);
  }
}));
