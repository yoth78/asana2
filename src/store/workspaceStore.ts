import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  // State
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

  // Department Actions
  addDepartment: (department: Department) => void;
  updateDepartment: (id: string, department: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  // Project Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Task Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Comment Actions
  addComment: (comment: Comment) => void;

  // Activity Log Actions
  addActivityLog: (entry: ActivityLogEntry) => void;

  // Payroll Actions
  updatePayrollStatus: (id: string, status: PayrollStatus) => void;
  addPayrollEntry: (entry: PayrollEntry) => void;

  // Getters
  getTasksByDepartment: (deptId: string) => Task[];
  getTasksByAssignee: (userId: string) => Task[];
  getProjectsByDepartment: (deptId: string) => Project[];
  getPayrollByDepartment: (deptId: string) => PayrollEntry[];
  getActivityByDepartment: (deptId: string) => ActivityLogEntry[];
}

const mockDate = new Date().toISOString();

const mockWorkspaces: Workspace[] = [];

const mockDepartments: Department[] = [];

const mockProjects: Project[] = [];

const mockTasks: Task[] = [];

const mockActivityLog: ActivityLogEntry[] = [];

const mockPayroll: PayrollEntry[] = [];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: mockWorkspaces,
      currentWorkspace: mockWorkspaces.length > 0 ? mockWorkspaces[0] : null,
      departments: mockDepartments,
      teams: [],
      projects: mockProjects,
      currentProject: null,
      tasks: mockTasks,
      comments: [],
      activityLog: mockActivityLog,
      payroll: mockPayroll,

      addDepartment: (department) =>
        set((state) => ({ departments: [...state.departments, department] })),
      updateDepartment: (id, updatedFields) =>
        set((state) => ({
          departments: state.departments.map((dept) =>
            dept.id === id ? { ...dept, ...updatedFields } : dept
          ),
        })),
      deleteDepartment: (id) =>
        set((state) => ({
          departments: state.departments.filter((dept) => dept.id !== id),
        })),

      setProjects: (projects) => set({ projects }),
      setCurrentProject: (project) => set({ currentProject: project }),
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id, updatedFields) =>
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === id ? { ...proj, ...updatedFields } : proj
          ),
          currentProject: state.currentProject?.id === id 
            ? { ...state.currentProject, ...updatedFields }
            : state.currentProject
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((proj) => proj.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject
        })),

      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (id, updatedFields) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updatedFields } : task
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      addComment: (comment) =>
        set((state) => ({ comments: [...state.comments, comment] })),

      addActivityLog: (entry) =>
        set((state) => ({ activityLog: [entry, ...state.activityLog] })),

      updatePayrollStatus: (id, status) =>
        set((state) => ({
          payroll: state.payroll.map((entry) =>
            entry.id === id ? { ...entry, status } : entry
          ),
        })),
      addPayrollEntry: (entry) =>
        set((state) => ({ payroll: [...state.payroll, entry] })),

      getTasksByDepartment: (deptId: string) => {
        return get().tasks.filter((task) => task.departmentId === deptId);
      },
      getTasksByAssignee: (userId: string) => {
        return get().tasks.filter((task) => task.assigneeId === userId);
      },
      getProjectsByDepartment: (deptId: string) => {
        return get().projects.filter((project) => project.departmentId === deptId);
      },
      getPayrollByDepartment: (deptId: string) => {
        return get().payroll.filter((entry) => entry.departmentId === deptId);
      },
      getActivityByDepartment: (deptId: string) => {
        return get().activityLog.filter((entry) => entry.departmentId === deptId);
      },
    }),
    {
      name: 'workspace-storage-v3',
    }
  )
);
