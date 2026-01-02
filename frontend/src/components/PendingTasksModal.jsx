import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Bell, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

export function PendingTasksModal({ isOpen, onClose }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            fetchTasks();
        }
    }, [isOpen]);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch("http://localhost:8000/api/dashboard/pending_tasks", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setTasks(data.tasks);
            }
        } catch (err) {
            console.error("Failed to fetch pending tasks", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (link) => {
        onClose();
        navigate(link);
    };

    if (!isOpen) return null;

    // Don't show if no tasks (unless loading) - actually parent handles isOpen mostly, but good to check
    if (!loading && tasks.length === 0) return null;

    return (
        <Dialog open={isOpen && tasks.length > 0} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-600" />
                        Action Required
                    </DialogTitle>
                    <DialogDescription>
                        You have {tasks.length} pending items that require your attention.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading tasks...</p>
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                className={`p-3 rounded-lg border flex items-start gap-3 ${task.priority === 'HIGH' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
                                    }`}
                            >
                                <div className={`mt-0.5 ${task.priority === 'HIGH' ? 'text-red-500' : 'text-blue-500'}`}>
                                    {task.priority === 'HIGH' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-semibold ${task.priority === 'HIGH' ? 'text-red-900' : 'text-blue-900'}`}>
                                        {task.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 mt-1">{task.message}</p>
                                    {task.action_link && (
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-xs mt-2 flex items-center gap-1"
                                            onClick={() => handleAction(task.action_link)}
                                        >
                                            Take Action <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
