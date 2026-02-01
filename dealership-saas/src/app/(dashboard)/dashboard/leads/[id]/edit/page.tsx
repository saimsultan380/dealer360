import { getLeadById } from '@/lib/actions/leads';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadForm } from '@/components/leads/lead-form';
import { redirect } from 'next/navigation';

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data: lead, error } = await getLeadById(id);

    if (error || !lead) {
        redirect('/dashboard/leads');
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Edit Lead</h1>
                <p className="text-muted-foreground mt-2">
                    Update lead information and status
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lead Information</CardTitle>
                    <CardDescription>
                        Update customer details and lead information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LeadForm leadId={id} />
                </CardContent>
            </Card>
        </div>
    );
}
