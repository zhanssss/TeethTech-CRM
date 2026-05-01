interface Order {
    id: string;
    patient: string;
    clinic: string;
    doctor: string;
    workType: string;
    deadline: string;
    status: string;
}

interface Task {
    id: string;
    orderId: string;
    title: string;
    technicianId: string;
    status: 'TODO' | 'MODELING' | 'MILLING' | 'POST_PROCESSING' | 'DONE';
    deadline: string;
}