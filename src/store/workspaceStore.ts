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

const mockWorkspaces: Workspace[] = [
  {
    id: 'w1',
    name: 'Acme Corp',
    ownerId: 'u1',
    createdAt: mockDate,
    updatedAt: mockDate,
  }
];

const mockDepartments: Department[] = [
  {
    id: 'dept1',
    name: 'Engineering',
    description: 'Software development and engineering',
    color: '#6C5CE7',
    adminId: 'u2',
    memberIds: ['u2', 'u4', 'u5'],
    createdAt: mockDate,
    updatedAt: mockDate,
  },
  {
    id: 'dept2',
    name: 'Marketing',
    description: 'Growth and digital marketing',
    color: '#00B894',
    adminId: 'u3',
    memberIds: ['u3', 'u6', 'u7'],
    createdAt: mockDate,
    updatedAt: mockDate,
  },
  {
    id: 'dept3',
    name: 'Design',
    description: 'Product design and UX',
    color: '#FD79A8',
    memberIds: [],
    createdAt: mockDate,
    updatedAt: mockDate,
  }
];

const mockProjects: Project[] = [
  { id: 'p1', workspaceId: 'w1', departmentId: 'dept1', name: 'Website Redesign', description: '', color: '#6C5CE7', ownerId: 'u2', createdAt: mockDate, updatedAt: mockDate },
  { id: 'p2', workspaceId: 'w1', departmentId: 'dept1', name: 'API Platform', description: '', color: '#0984E3', ownerId: 'u2', createdAt: mockDate, updatedAt: mockDate },
  { id: 'p3', workspaceId: 'w1', departmentId: 'dept2', name: 'Brand Campaign', description: '', color: '#00B894', ownerId: 'u3', createdAt: mockDate, updatedAt: mockDate },
  { id: 'p4', workspaceId: 'w1', departmentId: 'dept2', name: 'Social Media Strategy', description: '', color: '#FDCB6E', ownerId: 'u3', createdAt: mockDate, updatedAt: mockDate },
  { id: 'p5', workspaceId: 'w1', departmentId: 'dept3', name: 'Design System', description: '', color: '#FD79A8', ownerId: 'u1', createdAt: mockDate, updatedAt: mockDate },
];

const mockTasks: Task[] = [
  { id: 't1', projectId: 'p1', departmentId: 'dept1', title: 'Update homepage layout', description: '', status: 'DONE', priority: 'HIGH', assigneeId: 'u2', assigneeName: 'Alice (Eng Admin)', dueDate: '2026-08-01', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't2', projectId: 'p1', departmentId: 'dept1', title: 'Fix navigation bug', description: '', status: 'IN_PROGRESS', priority: 'URGENT', assigneeId: 'u4', assigneeName: 'Charlie', dueDate: '2026-08-08', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't3', projectId: 'p1', departmentId: 'dept1', title: 'Implement search', description: '', status: 'TODO', priority: 'MEDIUM', assigneeId: 'u5', assigneeName: 'Diana', dueDate: '2026-08-10', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't4', projectId: 'p1', departmentId: 'dept1', title: 'Optimize images', description: '', status: 'REVIEW', priority: 'LOW', assigneeId: 'u4', assigneeName: 'Charlie', dueDate: '2026-08-15', labels: [], createdAt: mockDate, updatedAt: mockDate },
  
  { id: 't5', projectId: 'p2', departmentId: 'dept1', title: 'Setup GraphQL server', description: '', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: 'u2', assigneeName: 'Alice (Eng Admin)', dueDate: '2026-08-12', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't6', projectId: 'p2', departmentId: 'dept1', title: 'Create authentication middleware', description: '', status: 'TODO', priority: 'URGENT', assigneeId: 'u5', assigneeName: 'Diana', dueDate: '2026-08-09', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't7', projectId: 'p2', departmentId: 'dept1', title: 'Write unit tests', description: '', status: 'TODO', priority: 'MEDIUM', assigneeId: 'u4', assigneeName: 'Charlie', dueDate: '2026-08-14', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't8', projectId: 'p2', departmentId: 'dept1', title: 'Deploy to staging', description: '', status: 'TODO', priority: 'HIGH', assigneeId: 'u2', assigneeName: 'Alice (Eng Admin)', dueDate: '2026-08-16', labels: [], createdAt: mockDate, updatedAt: mockDate },

  { id: 't9', projectId: 'p3', departmentId: 'dept2', title: 'Define target audience', description: '', status: 'DONE', priority: 'HIGH', assigneeId: 'u3', assigneeName: 'Bob (Mktg Admin)', dueDate: '2026-08-02', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't10', projectId: 'p3', departmentId: 'dept2', title: 'Draft ad copy', description: '', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: 'u6', assigneeName: 'Eve', dueDate: '2026-08-07', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't11', projectId: 'p3', departmentId: 'dept2', title: 'Design banners', description: '', status: 'TODO', priority: 'HIGH', assigneeId: 'u7', assigneeName: 'Frank', dueDate: '2026-08-11', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't12', projectId: 'p3', departmentId: 'dept2', title: 'Review budget', description: '', status: 'REVIEW', priority: 'URGENT', assigneeId: 'u3', assigneeName: 'Bob (Mktg Admin)', dueDate: '2026-08-13', labels: [], createdAt: mockDate, updatedAt: mockDate },

  { id: 't13', projectId: 'p4', departmentId: 'dept2', title: 'Create content calendar', description: '', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: 'u6', assigneeName: 'Eve', dueDate: '2026-08-09', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't14', projectId: 'p4', departmentId: 'dept2', title: 'Schedule weekly posts', description: '', status: 'TODO', priority: 'MEDIUM', assigneeId: 'u7', assigneeName: 'Frank', dueDate: '2026-08-14', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't15', projectId: 'p4', departmentId: 'dept2', title: 'Analyze engagement metrics', description: '', status: 'TODO', priority: 'LOW', assigneeId: 'u6', assigneeName: 'Eve', dueDate: '2026-08-18', labels: [], createdAt: mockDate, updatedAt: mockDate },
  
  { id: 't16', projectId: 'p5', departmentId: 'dept3', title: 'Choose color palette', description: '', status: 'DONE', priority: 'MEDIUM', assigneeId: 'u2', assigneeName: 'Alice (Eng Admin)', dueDate: '2026-08-05', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't17', projectId: 'p5', departmentId: 'dept3', title: 'Create typography guidelines', description: '', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: 'u3', assigneeName: 'Bob (Mktg Admin)', dueDate: '2026-08-12', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't18', projectId: 'p5', departmentId: 'dept3', title: 'Design button components', description: '', status: 'TODO', priority: 'MEDIUM', assigneeId: 'u4', assigneeName: 'Charlie', dueDate: '2026-08-15', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't19', projectId: 'p5', departmentId: 'dept3', title: 'Build icons library', description: '', status: 'TODO', priority: 'LOW', assigneeId: 'u5', assigneeName: 'Diana', dueDate: '2026-08-19', labels: [], createdAt: mockDate, updatedAt: mockDate },
  { id: 't20', projectId: 'p5', departmentId: 'dept3', title: 'Review accessibility', description: '', status: 'TODO', priority: 'URGENT', assigneeId: 'u2', assigneeName: 'Alice (Eng Admin)', dueDate: '2026-08-20', labels: [], createdAt: mockDate, updatedAt: mockDate },
];

const mockActivityLog: ActivityLogEntry[] = [
  { id: 'a1', userId: 'u2', userName: 'Alice (Eng Admin)', action: 'project_created', targetId: 'p1', targetType: 'PROJECT', departmentId: 'dept1', createdAt: mockDate },
  { id: 'a2', userId: 'u2', userName: 'Alice (Eng Admin)', action: 'task_created', targetId: 't1', targetType: 'TASK', departmentId: 'dept1', createdAt: mockDate },
  { id: 'a3', userId: 'u2', userName: 'Alice (Eng Admin)', action: 'task_completed', targetId: 't1', targetType: 'TASK', departmentId: 'dept1', createdAt: mockDate },
  { id: 'a4', userId: 'u3', userName: 'Bob (Mktg Admin)', action: 'project_created', targetId: 'p3', targetType: 'PROJECT', departmentId: 'dept2', createdAt: mockDate },
  { id: 'a5', userId: 'u3', userName: 'Bob (Mktg Admin)', action: 'task_created', targetId: 't9', targetType: 'TASK', departmentId: 'dept2', createdAt: mockDate },
  { id: 'a6', userId: 'u3', userName: 'Bob (Mktg Admin)', action: 'task_completed', targetId: 't9', targetType: 'TASK', departmentId: 'dept2', createdAt: mockDate },
  { id: 'a7', userId: 'u1', userName: 'Admin', action: 'department_created', targetId: 'dept1', targetType: 'DEPARTMENT', createdAt: mockDate },
  { id: 'a8', userId: 'u1', userName: 'Admin', action: 'department_created', targetId: 'dept2', targetType: 'DEPARTMENT', createdAt: mockDate },
  { id: 'a9', userId: 'u4', userName: 'Charlie', action: 'comment_added', targetId: 't4', targetType: 'TASK', departmentId: 'dept1', createdAt: mockDate },
  { id: 'a10', userId: 'u6', userName: 'Eve', action: 'comment_added', targetId: 't10', targetType: 'TASK', departmentId: 'dept2', createdAt: mockDate },
];

const mockPayroll: PayrollEntry[] = [
  { id: 'pr1', userId: 'u2', userName: 'Alice', departmentId: 'dept1', departmentName: 'Engineering', baseSalary: 8000, bonus: 500, deductions: 200, netPay: 8300, period: 'August 2026', status: 'PAID', createdAt: mockDate },
  { id: 'pr2', userId: 'u3', userName: 'Bob', departmentId: 'dept2', departmentName: 'Marketing', baseSalary: 7500, bonus: 0, deductions: 150, netPay: 7350, period: 'August 2026', status: 'PAID', createdAt: mockDate },
  { id: 'pr3', userId: 'u4', userName: 'Charlie', departmentId: 'dept1', departmentName: 'Engineering', baseSalary: 6000, bonus: 200, deductions: 100, netPay: 6100, period: 'August 2026', status: 'APPROVED', createdAt: mockDate },
  { id: 'pr4', userId: 'u5', userName: 'Diana', departmentId: 'dept1', departmentName: 'Engineering', baseSalary: 6200, bonus: 0, deductions: 100, netPay: 6100, period: 'August 2026', status: 'PENDING', createdAt: mockDate },
  { id: 'pr5', userId: 'u6', userName: 'Eve', departmentId: 'dept2', departmentName: 'Marketing', baseSalary: 5000, bonus: 100, deductions: 50, netPay: 5050, period: 'August 2026', status: 'PENDING', createdAt: mockDate },
  { id: 'pr6', userId: 'u7', userName: 'Frank', departmentId: 'dept2', departmentName: 'Marketing', baseSalary: 5100, bonus: 300, deductions: 50, netPay: 5350, period: 'August 2026', status: 'PENDING', createdAt: mockDate },
];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: mockWorkspaces,
      currentWorkspace: mockWorkspaces[0],
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
      name: 'workspace-storage',
    }
  )
);
