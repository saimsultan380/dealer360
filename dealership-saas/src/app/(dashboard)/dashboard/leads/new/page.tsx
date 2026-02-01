import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadForm } from '@/components/leads/lead-form';

export default function NewLeadPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">New Lead</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new potential customer to your sales pipeline
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lead Information</CardTitle>
                    <CardDescription>
                        Enter customer details and lead information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LeadForm />
                </CardContent>
            </Card>
        </div>
    );
}
